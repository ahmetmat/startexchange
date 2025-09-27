# smart_contracts/competition_app.py
from beaker import *
from pyteal import *

# Registry App'in arayüzünü tanımlıyoruz ki onu çağırabilelim.
class IStartupRegistry(Interface):
    def get_startup(startup_id: abi.Uint64, *, output: abi.NamedTuple): ...
    def is_startup_owner(owner: abi.Address, startup_id: abi.Uint64, *, output: abi.Bool): ...

# --------------------------------------------
# Constants
# --------------------------------------------
STATUS_UPCOMING = Int(0)
STATUS_ACTIVE = Int(1)
STATUS_ENDED = Int(2)
ERR_NOT_AUTHORIZED = Bytes("ERR_NOT_AUTHORIZED")
ERR_COMPETITION_ACTIVE = Bytes("ERR_COMPETITION_ACTIVE")
ERR_COMPETITION_NOT_ACTIVE = Bytes("ERR_COMPETITION_NOT_ACTIVE")
ERR_COMPETITION_ENDED = Bytes("ERR_COMPETITION_ENDED")
ERR_ALREADY_JOINED = Bytes("ERR_ALREADY_JOINED")
ERR_INVALID_CALLER = Bytes("ERR_INVALID_CALLER")

# --------------------------------------------
# Veri Yapıları
# --------------------------------------------
class Competition(abi.NamedTuple):
    name: abi.String
    description: abi.String
    start_time: abi.Uint64 # Artık block yerine timestamp daha esnek
    end_time: abi.Uint64
    status: abi.Uint64
    total_prize_pool: abi.Uint64
    max_participants: abi.Uint64
    entry_fee: abi.Uint64

class Participant(abi.NamedTuple):
    startup_owner: abi.Address
    joined_at: abi.Uint64
    score: abi.Uint64 # Sadece tek bir skor alanı yeterli
    rank: abi.Uint64
    reward_claimed: abi.Bool

class Results(abi.NamedTuple):
    first_place_sid: abi.Uint64
    second_place_sid: abi.Uint64
    third_place_sid: abi.Uint64
    rewards_distributed: abi.Bool

# --------------------------------------------
# Uygulama Durumu
# --------------------------------------------
class AppState:
    next_competition_id = GlobalStateValue(TealType.uint64, default=Int(1))
    owner = GlobalStateValue(TealType.bytes, default=Global.creator_address())
    registry_app_id = GlobalStateValue(TealType.uint64) # Registry App'i bilmesi için

app = Application("CompetitionApp", state=AppState())

# Box Mappings
competitions = BoxMapping(abi.Uint64, Competition)
results_map = BoxMapping(abi.Uint64, Results)
# Katılımcıları (p)articipant:(c)ompetition_id:(s)tartup_id anahtarıyla saklarız
participants = BoxMapping(abi.Tuple2[abi.Uint64, abi.Uint64], Participant)


# --------------------------------------------
# Lifecycle & Admin
# --------------------------------------------
@app.create
def create(registry_app_id: abi.Application):
    # Oluşturulurken Registry App'in ID'sini alırız
    return app.state.registry_app_id.set(registry_app_id.application_id())

@app.external
def set_owner(new_owner: abi.Address):
    return Assert(Txn.sender() == app.state.owner.get(), comment=ERR_NOT_AUTHORIZED), app.state.owner.set(new_owner.get())

@app.external(authorize=Authorize.only(app.state.owner))
def create_competition(
    name: abi.String,
    description: abi.String,
    start_time: abi.Uint64,
    end_time: abi.Uint64,
    prize_pool_payment: abi.PaymentTransaction, # Ödül havuzu dışarıdan yollanır
    max_participants: abi.Uint64,
    entry_fee: abi.Uint64,
    *,
    output: abi.Uint64
):
    cid = ScratchVar(TealType.uint64)
    comp = Competition()
    return Seq(
        Assert(start_time.get() < end_time.get(), comment="Invalid times"),
        # Ödül havuzu ödemesini doğrula
        Assert(prize_pool_payment.get().receiver() == Global.current_application_address()),
        
        cid.store(app.state.next_competition_id.get()),
        comp.set(
            name,
            description,
            start_time,
            end_time,
            abi.Uint64(STATUS_UPCOMING),
            abi.Uint64(prize_pool_payment.get().amount()),
            max_participants,
            entry_fee
        ),
        competitions[cid.load()].set(comp),
        app.state.next_competition_id.set(cid.load() + Int(1)),
        output.set(cid.load()),
    )

# --------------------------------------------
# Public Methods
# --------------------------------------------
@app.external
def join_competition(
    competition_id: abi.Uint64,
    startup_id: abi.Uint64,
    entry_fee_payment: abi.PaymentTransaction, # Ödeme artık direkt parametre, daha güvenli.
    *,
    output: abi.Bool
):
    cid = competition_id.get()
    sid = startup_id.get()
    comp = Competition()
    participant_key = abi.Tuple2[abi.Uint64, abi.Uint64]()
    
    is_owner = abi.Bool()

    return Seq(
        # 1. Yarışma bilgilerini ve kurallarını kontrol et
        participant_key.set(competition_id, startup_id),
        comp.decode(competitions[cid].get()),
        Assert(comp.status.get() == STATUS_UPCOMING, comment="Competition already started or ended"),
        Assert(entry_fee_payment.get().amount() == comp.entry_fee.get(), comment="Incorrect entry fee"),
        Assert(entry_fee_payment.get().receiver() == app.state.owner.get(), comment="Fee must be paid to owner"),
        Assert(participants[participant_key].exists() == Int(0), comment=ERR_ALREADY_JOINED),
        
        # 2. Registry App'i arayarak startup sahibini doğrula (ENTEGRASYON!)
        InnerTxnBuilder.ExecuteMethodCall(
            app_id=app.state.registry_app_id.get(),
            method_signature=IStartupRegistry.is_startup_owner.method_signature(),
            args=[abi.Address(Txn.sender()), startup_id],
            output_action=is_owner.decode,
        ),
        Assert(is_owner.get(), comment=ERR_INVALID_CALLER),
        
        # 3. Katılımcıyı kaydet
        (p := Participant()).set(
            abi.Address(Txn.sender()),
            Global.latest_timestamp(),
            abi.Uint64(0), # score
            abi.Uint64(0), # rank
            abi.Bool(False) # reward_claimed
        ),
        participants[participant_key].set(p),
        output.set(True)
    )

# --------------------------------------------
# Owner-Only Methods (Yarışma Yönetimi)
# --------------------------------------------
@app.external(authorize=Authorize.only(app.state.owner))
def update_status(competition_id: abi.Uint64, new_status: abi.Uint64, *, output: abi.Bool):
    # Yarışma durumunu manuel başlatma/bitirme için
    comp = Competition()
    return Seq(
        comp.decode(competitions[competition_id.get()].get()),
        comp.set_field(new_status, 4), # status alanı
        competitions[competition_id.get()].set(comp),
        output.set(True)
    )

@app.external(authorize=Authorize.only(app.state.owner))
def update_participant_score(
    competition_id: abi.Uint64, 
    startup_id: abi.Uint64, 
    new_score: abi.Uint64, 
    *, 
    output: abi.Bool
):
    # Oracle veya admin tarafından çağrılacak skor güncelleme fonksiyonu
    key = abi.Tuple2[abi.Uint64, abi.Uint64]()
    p = Participant()
    return Seq(
        key.set(competition_id, startup_id),
        p.decode(participants[key].get()),
        p.set_field(new_score, 2), # score alanı
        participants[key].set(p),
        output.set(True)
    )

@app.external(authorize=Authorize.only(app.state.owner))
def finalize_competition(
    competition_id: abi.Uint64,
    winner_sid: abi.Uint64,
    second_sid: abi.Uint64,
    third_sid: abi.Uint64,
    *,
    output: abi.Bool
):
    # Off-chain'de belirlenen kazananları on-chain'e kaydeder
    cid = competition_id.get()
    comp = Competition()
    key1, key2, key3 = (abi.Tuple2[abi.Uint64, abi.Uint64]() for _ in range(3))
    p1, p2, p3 = (Participant() for _ in range(3))

    return Seq(
        comp.decode(competitions[cid].get()),
        Assert(comp.status.get() == STATUS_ACTIVE, comment=ERR_COMPETITION_NOT_ACTIVE),

        # Kazananların rank'larını güncelle
        key1.set(competition_id, winner_sid),
        p1.decode(participants[key1].get()),
        p1.set_field(abi.Uint64(1), 3),
        participants[key1].set(p1),
        
        key2.set(competition_id, second_sid),
        p2.decode(participants[key2].get()),
        p2.set_field(abi.Uint64(2), 3),
        participants[key2].set(p2),
        
        key3.set(competition_id, third_sid),
        p3.decode(participants[key3].get()),
        p3.set_field(abi.Uint64(3), 3),
        participants[key3].set(p3),

        # Sonuçları kaydet ve yarışmayı bitir
        (res := Results()).set(winner_sid, second_sid, third_sid, abi.Bool(False)),
        results_map[cid].set(res),
        comp.set_field(abi.Uint64(STATUS_ENDED), 4),
        competitions[cid].set(comp),

        output.set(True)
    )

@app.external
def claim_reward(competition_id: abi.Uint64, startup_id: abi.Uint64, *, output: abi.Uint64):
    # Kazananlar ödüllerini talep eder
    cid = competition_id.get()
    sid = startup_id.get()
    key = abi.Tuple2[abi.Uint64, abi.Uint64]()
    p = Participant()
    comp = Competition()
    
    prize = ScratchVar(TealType.uint64)

    return Seq(
        key.set(competition_id, startup_id),
        p.decode(participants[key].get()),
        comp.decode(competitions[cid].get()),
        
        Assert(comp.status.get() == STATUS_ENDED, comment="Competition not ended"),
        Assert(Not(p.reward_claimed.get()), comment="Reward already claimed"),
        Assert(p.rank.get() > Int(0) and p.rank.get() <= Int(3), comment="Not a winner"),

        # Ödülü hesapla
        prize.store(
            Cond(
                [p.rank.get() == Int(1), comp.total_prize_pool.get() * Int(50) / Int(100)],
                [p.rank.get() == Int(2), comp.total_prize_pool.get() * Int(30) / Int(100)],
                [p.rank.get() == Int(3), comp.total_prize_pool.get() * Int(20) / Int(100)],
            )
        ),

        # Ödemeyi yap
        InnerTxnBuilder.Execute({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: p.startup_owner.get(),
            TxnField.amount: prize.load(),
        }),

        # Durumu güncelle
        p.set_field(abi.Bool(True), 4),
        participants[key].set(p),
        
        output.set(prize.load())
    )

# --------------------------------------------
# Read-only Methods
# --------------------------------------------
@app.read_only
def get_competition(competition_id: abi.Uint64, *, output: Competition):
    return output.decode(competitions[competition_id.get()].get())

@app.read_only
def get_participant(competition_id: abi.Uint64, startup_id: abi.Uint64, *, output: Participant):
    key = abi.Tuple2[abi.Uint64, abi.Uint64]()
    key.set(competition_id, startup_id)
    return output.decode(participants[key].get())