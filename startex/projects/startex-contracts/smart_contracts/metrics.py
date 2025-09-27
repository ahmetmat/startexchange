# smart_contracts/metrics_app.py
from ast import If
from beaker import *
from pyteal import *

# -------------------------------------------------
# Constants / Weights
# -------------------------------------------------

GITHUB_WEIGHT = Int(40)
SOCIAL_WEIGHT = Int(30)
PLATFORM_WEIGHT = Int(20)
DEMO_WEIGHT = Int(10)

ERR_NOT_AUTHORIZED = Bytes("ERR_NOT_AUTHORIZED")
ERR_NOT_FOUND = Bytes("ERR_NOT_FOUND")
ERR_INVALID_DATA = Bytes("ERR_INVALID_DATA")

# -------------------------------------------------
# ABI Tuples (Boxes'ta saklanacak kayıt biçimleri)
# -------------------------------------------------

class Metrics(abi.NamedTuple):
    github_commits: abi.Uint64
    github_stars: abi.Uint64
    github_forks: abi.Uint64
    twitter_followers: abi.Uint64
    linkedin_followers: abi.Uint64
    platform_posts: abi.Uint64
    demo_views: abi.Uint64
    last_updated: abi.Uint64
    total_score: abi.Uint64

class WeeklySnapshot(abi.NamedTuple):
    score: abi.Uint64
    github_growth: abi.Uint64
    social_growth: abi.Uint64
    platform_activity: abi.Uint64
    timestamp: abi.Uint64

# -------------------------------------------------
# App State
# -------------------------------------------------

class AppState:
    owner = GlobalStateValue(TealType.bytes, default=Global.creator_address())

app = Application("StartupMetricsApp", state=AppState())

# -------------------------------------------------
# Box Mappings & Keys
# -------------------------------------------------

# startup-metrics: key = sid(uint64)
metrics_map = BoxMapping(abi.Uint64, Metrics)

# authorized-oracles: key = Address, value = Bool
oracle_map = BoxMapping(abi.Address, abi.Bool)

# weekly-snapshots: composite key "w:{sid}:{week}" → WeeklySnapshot
@Subroutine(TealType.bytes)
def w_key(sid: Expr, week: Expr) -> Expr:
    return Concat(Bytes("w:"), Itob(sid), Bytes(":"), Itob(week))

# Generic tuple put/get helpers
@Subroutine(TealType.none)
def box_put_tuple(key: Expr, tup: abi.BaseType):
    db = abi.DynamicBytes()
    return Seq(tup.encode(db), app.box_put(key, db.get()))

@Subroutine(TealType.none)
def box_get_tuple(key: Expr, tup: abi.BaseType):
    exists = ScratchVar(TealType.uint64)
    raw = ScratchVar(TealType.bytes)
    db = abi.DynamicBytes()
    return Seq(
        exists.store(app.box_exists(key)),
        Assert(exists.load(), ERR_NOT_FOUND),
        raw.store(app.box_get(key).value()),
        db.set(raw.load()),
        tup.decode(db),
    )

# -------------------------------------------------
# Guards
# -------------------------------------------------

def only_owner() -> Expr:
    return Assert(Txn.sender() == app.state.owner.get(), ERR_NOT_AUTHORIZED)

@Subroutine(TealType.none)
def assert_oracle_or_owner(addr: Expr):
    """caller oracle olarak yetkili mi ya da owner mı?"""
    a = abi.Address()
    b = abi.Bool()
    return Seq(
        a.set(addr),
        If(Txn.sender() == app.state.owner.get()).Then(Approve()).Else(Seq(
            If(oracle_map[a].exists()).Then(oracle_map[a].get(b)).Else(b.set(False)),
            Assert(b.get(), ERR_NOT_AUTHORIZED),
        ))
    )

# -------------------------------------------------
# Private: Score Calcs  (Clarity mantığının aynısı)
# -------------------------------------------------

@Subroutine(TealType.uint64)
def calc_github_score(commits: Expr, stars: Expr, forks: Expr) -> Expr:
    # (/ commits 10) + (stars * 5) + (forks * 10)
    return (commits / Int(10)) + (stars * Int(5)) + (forks * Int(10))

@Subroutine(TealType.uint64)
def calc_social_score(twitter: Expr, linkedin: Expr) -> Expr:
    # (/ twitter 100) + (/ linkedin 50)
    return (twitter / Int(100)) + (linkedin / Int(50))

@Subroutine(TealType.uint64)
def calc_platform_score(posts: Expr) -> Expr:
    # posts * 20
    return posts * Int(20)

@Subroutine(TealType.uint64)
def calc_demo_score(views: Expr) -> Expr:
    # (/ views 10)
    return views / Int(10)

@Subroutine(TealType.uint64)
def weighted_total(github_s: Expr, social_s: Expr, platform_s: Expr, demo_s: Expr) -> Expr:
    # (github*40 + social*30 + platform*20 + demo*10) / 100
    return (github_s * GITHUB_WEIGHT + social_s * SOCIAL_WEIGHT + platform_s * PLATFORM_WEIGHT + demo_s * DEMO_WEIGHT) / Int(100)

# -------------------------------------------------
# Lifecycle
# -------------------------------------------------

@app.create
def create():
    return Approve()

@app.external
def set_owner(new_owner: abi.Address):
    only_owner()
    return app.state.owner.set(new_owner.get())

# -------------------------------------------------
# Mutating Methods
# -------------------------------------------------

@app.external
def initialize_metrics(startup_id: abi.Uint64, *, output: abi.Bool):
    sid = startup_id.get()
    m = Metrics()
    return Seq(
        # mevcutsa invalid
        Assert(Not(metrics_map[sid].exists()), ERR_INVALID_DATA),
        m.set(
            Int(0), Int(0), Int(0),  # commits, stars, forks
            Int(0), Int(0),          # twitter, linkedin
            Int(0),                  # platform_posts
            Int(0),                  # demo_views
            Global.round(),          # last_updated
            Int(0),                  # total_score
        ),
        metrics_map[sid].set(m),
        output.set(True),
    )

@app.external
def update_github_metrics(
    startup_id: abi.Uint64,
    commits: abi.Uint64,
    stars: abi.Uint64,
    forks: abi.Uint64,
    *,
    output: abi.Bool
):
    sid = startup_id.get()
    # yetki: oracle veya owner
    assert_oracle_or_owner(Txn.sender())

    # mevcut metrikleri al
    m = Metrics()
    metrics_map[sid].get(m)

    # unpack
    _commits = abi.Uint64()
    _stars = abi.Uint64()
    _forks = abi.Uint64()
    _twitter = abi.Uint64()
    _linkedin = abi.Uint64()
    _posts = abi.Uint64()
    _views = abi.Uint64()
    _last = abi.Uint64()
    _total = abi.Uint64()

    m.unpack(_commits, _stars, _forks, _twitter, _linkedin, _posts, _views, _last, _total)

    # güncelle
    m2 = Metrics()
    m2.set(
        commits.get(),
        stars.get(),
        forks.get(),
        _twitter.get(),
        _linkedin.get(),
        _posts.get(),
        _views.get(),
        Global.round(),
        Int(0),   # total sonra hesaplanacak
    )
    metrics_map[sid].set(m2)

    # yeniden hesapla
    recalc = App.external(b"recalculate_score")  # sadece okunaklılık; doğrudan inline yapacağız
    # Inline hesap:
    github_s = ScratchVar(TealType.uint64)
    social_s = ScratchVar(TealType.uint64)
    platform_s = ScratchVar(TealType.uint64)
    demo_s = ScratchVar(TealType.uint64)
    total_s = ScratchVar(TealType.uint64)

    return Seq(
        # Şu an m2'yi tekrar unpack edelim
        m_cur := Metrics(),
        metrics_map[sid].get(m_cur),
        c = abi.Uint64(); s = abi.Uint64(); f = abi.Uint64()
        ; tw = abi.Uint64(); li = abi.Uint64()
        ; pp = abi.Uint64(); dv = abi.Uint64()
        ; lu = abi.Uint64(); tt = abi.Uint64(),
        m_cur.unpack(c, s, f, tw, li, pp, dv, lu, tt),

        github_s.store(calc_github_score(c.get(), s.get(), f.get())),
        social_s.store(calc_social_score(tw.get(), li.get())),
        platform_s.store(calc_platform_score(pp.get())),
        demo_s.store(calc_demo_score(dv.get())),
        total_s.store(weighted_total(github_s.load(), social_s.load(), platform_s.load(), demo_s.load())),

        m_final := Metrics(),
        m_final.set(
            c.get(), s.get(), f.get(),
            tw.get(), li.get(),
            pp.get(), dv.get(),
            lu.get(),
            total_s.load(),
        ),
        metrics_map[sid].set(m_final),
        output.set(True),
    )

@app.external
def update_social_metrics(
    startup_id: abi.Uint64,
    twitter_followers: abi.Uint64,
    linkedin_followers: abi.Uint64,
    *,
    output: abi.Bool
):
    sid = startup_id.get()
    assert_oracle_or_owner(Txn.sender())

    m = Metrics()
    metrics_map[sid].get(m)

    # unpack
    c = abi.Uint64(); s = abi.Uint64(); f = abi.Uint64()
    tw = abi.Uint64(); li = abi.Uint64()
    pp = abi.Uint64(); dv = abi.Uint64()
    lu = abi.Uint64(); tt = abi.Uint64()

    m.unpack(c, s, f, tw, li, pp, dv, lu, tt)

    # set updated
    m2 = Metrics()
    m2.set(
        c.get(), s.get(), f.get(),
        twitter_followers.get(), linkedin_followers.get(),
        pp.get(), dv.get(),
        Global.round(),
        Int(0),
    )
    metrics_map[sid].set(m2)

    # recalc
    github_s = ScratchVar(TealType.uint64)
    social_s = ScratchVar(TealType.uint64)
    platform_s = ScratchVar(TealType.uint64)
    demo_s = ScratchVar(TealType.uint64)
    total_s = ScratchVar(TealType.uint64)

    return Seq(
        m_cur := Metrics(),
        metrics_map[sid].get(m_cur),
        c2 = abi.Uint64(); s2 = abi.Uint64(); f2 = abi.Uint64()
        ; tw2 = abi.Uint64(); li2 = abi.Uint64()
        ; pp2 = abi.Uint64(); dv2 = abi.Uint64()
        ; lu2 = abi.Uint64(); tt2 = abi.Uint64(),
        m_cur.unpack(c2, s2, f2, tw2, li2, pp2, dv2, lu2, tt2),

        github_s.store(calc_github_score(c2.get(), s2.get(), f2.get())),
        social_s.store(calc_social_score(tw2.get(), li2.get())),
        platform_s.store(calc_platform_score(pp2.get())),
        demo_s.store(calc_demo_score(dv2.get())),
        total_s.store(weighted_total(github_s.load(), social_s.load(), platform_s.load(), demo_s.load())),

        m_final := Metrics(),
        m_final.set(
            c2.get(), s2.get(), f2.get(),
            tw2.get(), li2.get(),
            pp2.get(), dv2.get(),
            lu2.get(),
            total_s.load(),
        ),
        metrics_map[sid].set(m_final),
        output.set(True),
    )

@app.external
def update_platform_metrics(
    startup_id: abi.Uint64,
    posts: abi.Uint64,
    demo_views: abi.Uint64,
    *,
    output: abi.Bool
):
    # Clarity'de bu fonksiyonda oracle/owner kontrolü yoktu → aynen bırakıyoruz
    sid = startup_id.get()

    m = Metrics()
    metrics_map[sid].get(m)

    # unpack
    c = abi.Uint64(); s = abi.Uint64(); f = abi.Uint64()
    tw = abi.Uint64(); li = abi.Uint64()
    pp = abi.Uint64(); dv = abi.Uint64()
    lu = abi.Uint64(); tt = abi.Uint64()

    m.unpack(c, s, f, tw, li, pp, dv, lu, tt)

    # set updated
    m2 = Metrics()
    m2.set(
        c.get(), s.get(), f.get(),
        tw.get(), li.get(),
        posts.get(), demo_views.get(),
        Global.round(),
        Int(0),
    )
    metrics_map[sid].set(m2)

    # recalc
    github_s = ScratchVar(TealType.uint64)
    social_s = ScratchVar(TealType.uint64)
    platform_s = ScratchVar(TealType.uint64)
    demo_s = ScratchVar(TealType.uint64)
    total_s = ScratchVar(TealType.uint64)

    return Seq(
        m_cur := Metrics(),
        metrics_map[sid].get(m_cur),
        c2 = abi.Uint64(); s2 = abi.Uint64(); f2 = abi.Uint64()
        ; tw2 = abi.Uint64(); li2 = abi.Uint64()
        ; pp2 = abi.Uint64(); dv2 = abi.Uint64()
        ; lu2 = abi.Uint64(); tt2 = abi.Uint64(),
        m_cur.unpack(c2, s2, f2, tw2, li2, pp2, dv2, lu2, tt2),

        github_s.store(calc_github_score(c2.get(), s2.get(), f2.get())),
        social_s.store(calc_social_score(tw2.get(), li2.get())),
        platform_s.store(calc_platform_score(pp2.get())),
        demo_s.store(calc_demo_score(dv2.get())),
        total_s.store(weighted_total(github_s.load(), social_s.load(), platform_s.load(), demo_s.load())),

        m_final := Metrics(),
        m_final.set(
            c2.get(), s2.get(), f2.get(),
            tw2.get(), li2.get(),
            pp2.get(), dv2.get(),
            lu2.get(),
            total_s.load(),
        ),
        metrics_map[sid].set(m_final),
        output.set(True),
    )

@app.external
def take_weekly_snapshot(
    startup_id: abi.Uint64,
    week: abi.Uint64,
    *,
    output: abi.Bool
):
    # only owner
    only_owner()

    sid = startup_id.get()
    wk = week.get()

    m = Metrics()
    metrics_map[sid].get(m)

    # score'u oku
    c = abi.Uint64(); s = abi.Uint64(); f = abi.Uint64()
    tw = abi.Uint64(); li = abi.Uint64()
    pp = abi.Uint64(); dv = abi.Uint64()
    lu = abi.Uint64(); tt = abi.Uint64()

    m.unpack(c, s, f, tw, li, pp, dv, lu, tt)

    snap = WeeklySnapshot()
    return Seq(
        snap.set(
            tt.get(),               # score
            Int(0),                 # github_growth (placeholder)
            Int(0),                 # social_growth (placeholder)
            pp.get(),               # platform_activity
            Global.round(),         # timestamp
        ),
        box_put_tuple(w_key(sid, wk), snap),
        output.set(True),
    )

@app.external
def authorize_oracle(oracle: abi.Address, *, output: abi.Bool):
    only_owner()
    b = abi.Bool()
    b.set(True)
    oracle_map[oracle].set(b)
    return output.set(True)

# -------------------------------------------------
# Read-only Methods
# -------------------------------------------------

@app.read_only
def get_metrics(startup_id: abi.Uint64, *, output: Metrics):
    metrics_map[startup_id.get()].get(output)

@app.read_only
def get_weekly_snapshot(startup_id: abi.Uint64, week: abi.Uint64, *, output: WeeklySnapshot):
    box_get_tuple(w_key(startup_id.get(), week.get()), output)

@app.read_only
def get_score(startup_id: abi.Uint64, *, found: abi.Bool, score: abi.Uint64):
    sid = startup_id.get()
    m = Metrics()
    return Seq(
        If(metrics_map[sid].exists())
        .Then(Seq(
            metrics_map[sid].get(m),
            c = abi.Uint64(); s = abi.Uint64(); f = abi.Uint64()
            ; tw = abi.Uint64(); li = abi.Uint64()
            ; pp = abi.Uint64(); dv = abi.Uint64()
            ; lu = abi.Uint64(); tt = abi.Uint64(),
            m.unpack(c, s, f, tw, li, pp, dv, lu, tt),
            found.set(True),
            score.set(tt.get()),
        ))
        .Else(Seq(
            found.set(False),
            score.set(Int(0)),
        ))
    )

@app.read_only
def is_oracle_authorized(oracle: abi.Address, *, output: abi.Bool):
    b = abi.Bool()
    return Seq(
        If(oracle_map[oracle].exists())
        .Then(oracle_map[oracle].get(b))
        .Else(b.set(False)),
        output.set(b.get()),
    )