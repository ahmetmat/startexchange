# smart_contracts/startup_registry_app.py
from beaker import *
from pyteal import *
from .launchpad_app import app as launchpad_app_template

ERR_NOT_AUTHORIZED = Bytes("ERR_NOT_AUTHORIZED")
ERR_NOT_FOUND = Bytes("ERR_NOT_FOUND")
ERR_INVALID_DATA = Bytes("ERR_INVALID_DATA")
ERR_LAUNCHPAD_EXISTS = Bytes("ERR_LAUNCHPAD_EXISTS")

class AppState:
    owner = GlobalStateValue(TealType.bytes, default=Global.creator_address())
    next_startup_id = GlobalStateValue(TealType.uint64, default=Int(1))

app = Application("StartupRegistryApp", state=AppState())

# -----------------------
# Box Storage & Veri Yapısı
# -----------------------

# Startup verisini tutan yapı. Launchpad App ID'si eklendi.
class Startup(abi.NamedTuple):
    owner: abi.Address
    name: abi.String
    description: abi.String
    github_repo: abi.String
    website: abi.String
    twitter: abi.String
    token_address: abi.Address # ASA ID'sini tutar
    created_at: abi.Uint64
    is_verified: abi.Bool
    total_score: abi.Uint64
    launchpad_app_id: abi.Uint64 # Her startup'a özel fonlama sözleşmesinin ID'si

startups = BoxMapping(abi.Uint64, Startup)

# -----------------------
# Guards (Yetki Kontrolleri)
# -----------------------
def only_app_owner(output: abi.Bool):
    return output.set(Txn.sender() == app.state.owner.get())

# -----------------------
# Lifecycle
# -----------------------

@app.create
def create():
    return Approve()

@app.external
def set_contract_owner(new_owner: abi.Address, *, output: abi.Bool):
    return Seq(
        Assert(Txn.sender() == app.state.owner.get(), comment=ERR_NOT_AUTHORIZED),
        app.state.owner.set(new_owner.get()),
        output.set(True)
    )

# -----------------------
# Startup Yönetimi
# -----------------------

@app.external
def register_startup(
    name: abi.String,
    description: abi.String,
    github_repo: abi.String,
    website: abi.String,
    twitter: abi.String,
    token_address: abi.Address, # Oluşturulan ASA'nın adresi (veya ID'si)
    *,
    output: abi.Uint64
):
    caller = Txn.sender()
    sid = ScratchVar(TealType.uint64)
    st = Startup()

    return Seq(
        Assert(Len(name.get()) > Int(0), comment=ERR_INVALID_DATA),
        Assert(Len(github_repo.get()) > Int(0), comment=ERR_INVALID_DATA),

        sid.store(app.state.next_startup_id.get()),
        st.set(
            abi.Address(caller),
            name,
            description,
            github_repo,
            website,
            twitter,
            token_address,
            Global.latest_timestamp(),
            abi.Bool(False), # is_verified
            abi.Uint64(0),   # total_score
            abi.Uint64(0)    # launchpad_app_id (henüz yok)
        ),
        startups[sid.load()].set(st),
        app.state.next_startup_id.set(sid.load() + Int(1)),
        output.set(sid.load()),
    )

@app.external
def update_startup(
    startup_id: abi.Uint64,
    name: abi.String,
    description: abi.String,
    website: abi.String,
    twitter: abi.String,
    *,
    output: abi.Bool
):
    sid = startup_id.get()
    st = Startup()
    owner = abi.Address()

    return Seq(
        st.decode(startups[sid].get()),
        st.get_field(owner, 0),
        Assert(Txn.sender() == owner.get(), comment=ERR_NOT_AUTHORIZED),

        # Sadece belirli alanların güncellenmesine izin verelim
        st.set_field(name, 1),
        st.set_field(description, 2),
        st.set_field(website, 4),
        st.set_field(twitter, 5),
        
        startups[sid].set(st),
        output.set(True),
    )

# -----------------------
# Platform Sahibi Fonksiyonları
# -----------------------

@app.external
def verify_startup(startup_id: abi.Uint64, verified_status: abi.Bool, *, output: abi.Bool):
    st = Startup()
    return Seq(
        Assert(Txn.sender() == app.state.owner.get(), comment=ERR_NOT_AUTHORIZED),
        st.decode(startups[startup_id.get()].get()),
        st.set_field(verified_status, 8), # is_verified
        startups[startup_id.get()].set(st),
        output.set(True),
    )

@app.external
def update_score(startup_id: abi.Uint64, new_score: abi.Uint64, *, output: abi.Bool):
    st = Startup()
    return Seq(
        Assert(Txn.sender() == app.state.owner.get(), comment=ERR_NOT_AUTHORIZED),
        st.decode(startups[startup_id.get()].get()),
        st.set_field(new_score, 9), # total_score
        startups[startup_id.get()].set(st),
        output.set(True),
    )

# -----------------------
# FABRİKA FONKSİYONU (YENİ)
# -----------------------

@app.external
def create_launchpad(
    startup_id: abi.Uint64,
    payment_for_mbr: abi.PaymentTransaction,
    *,
    output: abi.Uint64
):
    sid = startup_id.get()
    st = Startup()
    owner = abi.Address()
    token_addr = abi.Address()
    launchpad_id = abi.Uint64()

    return Seq(
        # 1. Startup'ı getir ve kontrolleri yap
        st.decode(startups[sid].get()),
        st.get_field(owner, 0),
        st.get_field(token_addr, 6),
        st.get_field(launchpad_id, 10),

        Assert(Txn.sender() == owner.get(), comment=ERR_NOT_AUTHORIZED),
        Assert(launchpad_id.get() == Int(0), comment=ERR_LAUNCHPAD_EXISTS),
        
        # 2. Yeni App'in minimum bakiye gereksinimi için ödemeyi kontrol et
        Assert(payment_for_mbr.get().receiver() == Global.current_application_address()),
        Assert(payment_for_mbr.get().amount() >= Global.min_balance() + (Int(1000) * (
            launchpad_app_template.app_state.num_uints + launchpad_app_template.app_state.num_byte_slices
        ))),

        # 3. Inner transaction ile yeni LaunchpadApp'i oluştur
        InnerTxnBuilder.Execute({
            TxnField.type_enum: TxnType.ApplicationCall,
            TxnField.on_completion: OnComplete.NoOp,
            TxnField.approval_program: Bytes(launchpad_app_template.approval_program),
            TxnField.clear_state_program: Bytes(launchpad_app_template.clear_state_program),
            TxnField.global_state_schema: launchpad_app_template.build().global_state_schema,
            TxnField.local_state_schema: launchpad_app_template.build().local_state_schema,
            TxnField.application_args: [
                Bytes("setup"),
                owner.get(),
                Itob(AssetParam.creator(token_addr.get()).value()) # ASA'nın ID'sini değil, adresini kullanıyorsak
            ],
        }),
        
        # 4. Oluşturulan App ID'sini al ve kaydet
        new_app_id := InnerTxn.created_application_id(),
        st.set_field(abi.Uint64(new_app_id), 10),
        startups[sid].set(st),
        
        output.set(new_app_id),
    )

# -----------------------
# Read-only Methods
# -----------------------

@app.read_only
def get_startup(startup_id: abi.Uint64, *, output: Startup):
    return output.decode(startups[startup_id.get()].get())

@app.read_only
def get_next_startup_id(*, output: abi.Uint64):
    output.set(app.state.next_startup_id.get())