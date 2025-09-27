# smart_contracts/launchpad_app.py
from beaker import *
from pyteal import *

class LaunchpadState:
    startup_owner = GlobalStateValue(TealType.bytes)
    token_id = GlobalStateValue(TealType.uint64)
    token_price_microalgos = GlobalStateValue(TealType.uint64)
    sale_start_time = GlobalStateValue(TealType.uint64)
    sale_end_time = GlobalStateValue(TealType.uint64)
    total_raised_microalgos = GlobalStateValue(TealType.uint64, default=Int(0))
    is_sale_active = GlobalStateValue(TealType.uint64, default=Int(0))

app = Application("LaunchpadApp", state=LaunchpadState())

@app.create
def create():
    return Approve()

@app.external(method_config={"bare": True})
def setup(owner: abi.Address, token_id: abi.Uint64):
    return Seq(
        Assert(Txn.sender() == Global.creator_address(), comment="Only factory can call setup"),
        app.state.startup_owner.set(owner.get()),
        app.state.token_id.set(token_id.get()),
    )

@app.external
def set_sale_parameters(
    price: abi.Uint64, # MicroAlgos cinsinden
    start_time: abi.Uint64, # Unix timestamp
    end_time: abi.Uint64, # Unix timestamp
    *,
    output: abi.Bool
):
    return Seq(
        Assert(Txn.sender() == app.state.startup_owner.get(), comment="Only owner"),
        Assert(start_time.get() < end_time.get(), comment="Invalid times"),
        app.state.token_price_microalgos.set(price.get()),
        app.state.sale_start_time.set(start_time.get()),
        app.state.sale_end_time.set(end_time.get()),
        output.set(True)
    )

@app.external
def activate_sale(*, output: abi.Bool):
    return Seq(
        Assert(Txn.sender() == app.state.startup_owner.get(), comment="Only owner"),
        app.state.is_sale_active.set(Int(1)),
        output.set(True)
    )

@app.external
def opt_in_to_asset(*, output: abi.Bool):
    # Bu kontratın token'ları tutabilmesi için ASA'ya opt-in yapması gerekir.
    return Seq(
        Assert(Txn.sender() == app.state.startup_owner.get(), comment="Only owner"),
        InnerTxnBuilder.Execute({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: app.state.token_id.get(),
            TxnField.asset_receiver: Global.current_application_address(),
            TxnField.asset_amount: Int(0),
        }),
        output.set(True)
    )

@app.external
def fund(axfer: abi.AssetTransferTransaction, *, output: abi.Bool):
    # Startup sahibi, satılacak token'ları bu kontrata gönderir.
    return Seq(
        Assert(Txn.sender() == app.state.startup_owner.get(), comment="Only owner"),
        Assert(axfer.get().xfer_asset() == app.state.token_id.get()),
        Assert(axfer.get().asset_receiver() == Global.current_application_address()),
        output.set(True)
    )

@app.external
def buy_tokens(payment: abi.PaymentTransaction, *, output: abi.Uint64):
    token_price = app.state.token_price_microalgos.get()
    tokens_to_buy = payment.get().amount() / token_price
    
    return Seq(
        Assert(app.state.is_sale_active.get() == Int(1), comment="Sale not active"),
        Assert(Global.latest_timestamp() >= app.state.sale_start_time.get(), comment="Sale not started"),
        Assert(Global.latest_timestamp() < app.state.sale_end_time.get(), comment="Sale ended"),
        Assert(payment.get().receiver() == Global.current_application_address(), comment="Invalid receiver"),
        Assert(payment.get().amount() % token_price == Int(0), comment="Invalid payment amount"),

        # Kontratın bakiyesinde yeterli token var mı kontrolü
        token_balance := AssetHolding.balance(Global.current_application_address(), app.state.token_id.get()),
        Assert(token_balance.value() >= tokens_to_buy, comment="Not enough tokens in contract"),

        # Token'ları alıcıya gönder
        InnerTxnBuilder.Execute({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: app.state.token_id.get(),
            TxnField.asset_receiver: payment.get().sender(),
            TxnField.asset_amount: tokens_to_buy,
        }),

        app.state.total_raised_microalgos.set(app.state.total_raised_microalgos.get() + payment.get().amount()),
        output.set(tokens_to_buy)
    )

@app.external
def claim_funds(*, output: abi.Bool):
    return Seq(
        Assert(Txn.sender() == app.state.startup_owner.get(), comment="Only owner"),
        Assert(Global.latest_timestamp() >= app.state.sale_end_time.get(), comment="Sale not ended"),

        InnerTxnBuilder.Execute({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: app.state.startup_owner.get(),
            TxnField.amount: app.state.total_raised_microalgos.get(),
            TxnField.close_remainder_to: app.state.startup_owner.get() # İsteğe bağlı, tüm ALGO'ları çeker
        }),
        app.state.total_raised_microalgos.set(Int(0)),
        output.set(True)
    )