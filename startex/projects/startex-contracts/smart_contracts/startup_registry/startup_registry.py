# smart_contracts/startup_registry/startup_registry_app.py

from beaker.application import Application
from beaker.state import GlobalStateValue
from beaker.lib.storage import BoxMapping
from pyteal import *

# StateSchema import: SDK sürüm farklarına dayanıklı
try:
    from algosdk.future.transaction import StateSchema
except Exception:
    from algosdk.transaction import StateSchema

# ---- Sabit hata mesajları (Assert(comment=...)) ----
ERR_NOT_AUTHORIZED = "ERR_NOT_AUTHORIZED"
ERR_NOT_FOUND = "ERR_NOT_FOUND"
ERR_INVALID_DATA = "ERR_INVALID_DATA"
ERR_LAUNCHPAD_EXISTS = "ERR_LAUNCHPAD_EXISTS"

# ---- Dummy Launchpad App (yerine gerçek app'i import edebilirsin) ----
class DummyLaunchpadState:
    num_uints = 1
    num_byte_slices = 1

class DummyLaunchpadApp:
    approval_program = b"#pragma version 8\nint 1\nreturn"
    clear_state_program = b"#pragma version 8\nint 1\nreturn"
    global_state_schema = StateSchema(num_uints=1, num_byte_slices=1)
    local_state_schema = StateSchema(num_uints=0, num_byte_slices=0)
    app_state = DummyLaunchpadState()
    def build(self):
        return self

launchpad_app_template = DummyLaunchpadApp()
# Gerçek senaryoda:
# from .launchpad_app import app as launchpad_app_template

# ---- Uygulama State ----
class AppState:
    owner = GlobalStateValue(TealType.bytes, default=Global.creator_address())
    next_startup_id = GlobalStateValue(TealType.uint64, default=Int(1))

app = Application("StartupRegistryApp", state=AppState())

# ---- Veri Yapısı (BoxMapping) ----
# BoxMapping key'i bytes ister; abi.Uint64().encode() ile indeksleyeceğiz.
class Startup(abi.NamedTuple):
    owner: abi.Field[abi.Address]
    name: abi.Field[abi.String]
    description: abi.Field[abi.String]
    github_repo: abi.Field[abi.String]
    website: abi.Field[abi.String]
    twitter: abi.Field[abi.String]
    token_asset_id: abi.Field[abi.Uint64]  # ASA id
    created_at: abi.Field[abi.Uint64]
    is_verified: abi.Field[abi.Bool]
    total_score: abi.Field[abi.Uint64]
    launchpad_app_id: abi.Field[abi.Uint64]

startups = BoxMapping(abi.Uint64, Startup)

# ---- Lifecycle ----
@app.create
def create():
    return Approve()

# ---- Sahiplik ----
@app.external
def set_contract_owner(new_owner: abi.Address, *, output: abi.Bool):
    return Seq(
        Assert(Txn.sender() == app.state.owner.get(), comment=ERR_NOT_AUTHORIZED),
        app.state.owner.set(new_owner.get()),
        output.set(True),
    )

# ---- Startup CRUD ----
@app.external
def register_startup(
    name: abi.String,
    description: abi.String,
    github_repo: abi.String,
    website: abi.String,
    twitter: abi.String,
    token_asset_id: abi.Uint64,  # ASA id
    *,
    output: abi.Uint64
):
    # id üretimi ve tuple alanları
    sid = ScratchVar(TealType.uint64)

    st = Startup()
    owner_addr = abi.Address()
    created_at_u64 = abi.Uint64()
    is_verified_b = abi.Bool()
    total_score_u64 = abi.Uint64()
    launchpad_id_u64 = abi.Uint64()

    key_u64 = abi.Uint64()  # BoxMapping key'i için

    return Seq(
        # Giriş kontrolü
        Assert(Len(name.get()) > Int(0), comment=ERR_INVALID_DATA),
        Assert(Len(github_repo.get()) > Int(0), comment=ERR_INVALID_DATA),

        # Değer ata
        owner_addr.set(Txn.sender()),
        created_at_u64.set(Global.latest_timestamp()),
        is_verified_b.set(Int(0)),     # False
        total_score_u64.set(Int(0)),
        launchpad_id_u64.set(Int(0)),

        # Yeni id
        sid.store(app.state.next_startup_id.get()),

        # Tuple set (sıra önemli)
        st.set(
            owner_addr,          # 0
            name,                # 1
            description,         # 2
            github_repo,         # 3
            website,             # 4
            twitter,             # 5
            token_asset_id,      # 6
            created_at_u64,      # 7
            is_verified_b,       # 8
            total_score_u64,     # 9
            launchpad_id_u64     # 10
        ),

        # BoxMapping: bytes key ile set
        key_u64.set(sid.load()),
        startups[key_u64.encode()].set(st),

        # next id ve çıktı
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
    st = Startup()
    owner = abi.Address()
    key_u64 = abi.Uint64()

    return Seq(
        key_u64.set(startup_id.get()),
        Assert(startups[key_u64.encode()].exists(), comment=ERR_NOT_FOUND),

        st.decode(startups[key_u64.encode()].get()),
        st.get_field(owner, 0),
        Assert(Txn.sender() == owner.get(), comment=ERR_NOT_AUTHORIZED),

        st.set_field(name, 1),
        st.set_field(description, 2),
        st.set_field(website, 4),
        st.set_field(twitter, 5),

        startups[key_u64.encode()].set(st),
        output.set(True),
    )

# ---- Platform Owner İşlemleri ----
@app.external
def verify_startup(startup_id: abi.Uint64, verified_status: abi.Bool, *, output: abi.Bool):
    st = Startup()
    key_u64 = abi.Uint64()
    return Seq(
        Assert(Txn.sender() == app.state.owner.get(), comment=ERR_NOT_AUTHORIZED),
        key_u64.set(startup_id.get()),
        Assert(startups[key_u64.encode()].exists(), comment=ERR_NOT_FOUND),

        st.decode(startups[key_u64.encode()].get()),
        st.set_field(verified_status, 8),
        startups[key_u64.encode()].set(st),
        output.set(True),
    )

@app.external
def update_score(startup_id: abi.Uint64, new_score: abi.Uint64, *, output: abi.Bool):
    st = Startup()
    key_u64 = abi.Uint64()
    return Seq(
        Assert(Txn.sender() == app.state.owner.get(), comment=ERR_NOT_AUTHORIZED),
        key_u64.set(startup_id.get()),
        Assert(startups[key_u64.encode()].exists(), comment=ERR_NOT_FOUND),

        st.decode(startups[key_u64.encode()].get()),
        st.set_field(new_score, 9),
        startups[key_u64.encode()].set(st),
        output.set(True),
    )

# ---- Launchpad Factory (Inner App Create) ----
@app.external
def create_launchpad(
    startup_id: abi.Uint64,
    payment_for_mbr: abi.PaymentTransaction,
    *,
    output: abi.Uint64
):
    st = Startup()

    owner = abi.Address()
    token_id = abi.Uint64()
    existing_launchpad_id = abi.Uint64()

    launchpad_spec = launchpad_app_template.build()
    new_app_id_sv = ScratchVar(TealType.uint64)
    key_u64 = abi.Uint64()

    return Seq(
        key_u64.set(startup_id.get()),
        Assert(startups[key_u64.encode()].exists(), comment=ERR_NOT_FOUND),

        st.decode(startups[key_u64.encode()].get()),
        st.get_field(owner, 0),
        st.get_field(token_id, 6),
        st.get_field(existing_launchpad_id, 10),

        Assert(Txn.sender() == owner.get(), comment=ERR_NOT_AUTHORIZED),
        Assert(existing_launchpad_id.get() == Int(0), comment=ERR_LAUNCHPAD_EXISTS),

        # MBR doğrulaması (basit yaklaşım)
        Assert(payment_for_mbr.get().receiver() == Global.current_application_address()),
        Assert(
            payment_for_mbr.get().amount()
            >= Global.min_balance()
            + Int(1000) * (Int(launchpad_spec.app_state.num_uints) + Int(launchpad_spec.app_state.num_byte_slices))
        ),

        # Inner App Create
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.ApplicationCall,
            TxnField.on_completion: OnComplete.NoOp,

            # Program bytes (compile-time sabitler)
            TxnField.approval_program: Bytes(launchpad_spec.approval_program),
            TxnField.clear_state_program: Bytes(launchpad_spec.clear_state_program),

            # Schema sayıları (objeyi değil numaraları ver)
            TxnField.global_num_uints: Int(launchpad_spec.global_state_schema.num_uints),
            TxnField.global_num_byte_slices: Int(launchpad_spec.global_state_schema.num_byte_slices),
            TxnField.local_num_uints: Int(launchpad_spec.local_state_schema.num_uints),
            TxnField.local_num_byte_slices: Int(launchpad_spec.local_state_schema.num_byte_slices),

            # Args
            TxnField.application_args: [
                Bytes("setup"),
                owner.get(),
                token_id.encode(),
            ],
        }),
        InnerTxnBuilder.Submit(),

        new_app_id_sv.store(InnerTxn.created_application_id()),
        st.set_field(abi.Uint64(new_app_id_sv.load()), 10),
        startups[key_u64.encode()].set(st),
        output.set(new_app_id_sv.load()),
    )

# ---- Read-only ----
@app.external(read_only=True)
def get_startup(startup_id: abi.Uint64, *, output: Startup):
    key_u64 = abi.Uint64()
    return Seq(
        key_u64.set(startup_id.get()),
        output.decode(startups[key_u64.encode()].get())
    )

@app.external(read_only=True)
def get_next_startup_id(*, output: abi.Uint64):
    return output.set(app.state.next_startup_id.get())