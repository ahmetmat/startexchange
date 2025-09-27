from pathlib import Path
import json

from beaker import localnet
# ↑ beaker>=1.0 olmalı
# Kontrat uygulamalarını içeri al
from .startup_registry_app import app as StartupRegistryApp
from .metrics_app import app as MetricsApp
from .competition_app import app as CompetitionApp
from .tokenization_app import app as TokenizationApp

APPS = [
    StartupRegistryApp,
    MetricsApp,
    CompetitionApp,
    TokenizationApp,
]

def build_all(out_dir: str = "smart_contracts/artifacts") -> None:
    """
    Tüm Beaker/PyTeal uygulamalarını derleyip
    - TEAL approval & clear
    - ARC-56 JSON (app spec)
    çıktısını out_dir altına yazar.
    """
    algod = localnet.get_algod_client()

    base = Path(out_dir)
    base.mkdir(parents=True, exist_ok=True)

    for a in APPS:
        # Beaker 1.x build: approval/clear üretir
        result = a.build(algod)
        # Beaker 1.x’te ARC-56 almak için:
        # a_spec = a.to_arc56_json_dict()  (bazı sürümlerde)
        # Alternatif isimler:
        #   a_spec = a.arc56()                     # returns pydantic model
        #   a_spec = a.to_arc56()                  # returns model
        #   a_spec = a.to_application_spec()       # ARC-32
        # Aşağıdaki blok çeşitli sürümlerle uyumlu çalışır:
        a_spec = None
        for method_name in ("to_arc56_json_dict", "to_arc56", "arc56", "to_application_spec"):
            if hasattr(a, method_name):
                m = getattr(a, method_name)
                out = m()
                # pydantic model ise .model_dump() gerekebilir
                if hasattr(out, "model_dump"):
                    out = out.model_dump()
                a_spec = out
                break
        if a_spec is None:
            raise RuntimeError(f"ARC spec üretilemedi: {a.name}")

        # Klasör: artifacts/<app_name_lowercase>/
        out_app_dir = base / a.name.lower()
        out_app_dir.mkdir(parents=True, exist_ok=True)

        # TEAL yaz
        (out_app_dir / f"{a.name}.approval.teal").write_text(result.approval)
        (out_app_dir / f"{a.name}.clear.teal").write_text(result.clear)

        # ARC JSON yaz (varsa 56 yoksa 32 adıyla)
        arc_file = out_app_dir / f"{a.name}.arc56.json"
        # Eğer to_application_spec kullanıldıysa 32:
        if "schema" in a_spec and "arcs" in a_spec and 56 not in a_spec.get("arcs", []):
            arc_file = out_app_dir / f"{a.name}.arc32.json"

        (arc_file).write_text(json.dumps(a_spec, indent=2, ensure_ascii=False))

        print(f"✅ Built {a.name} → {out_app_dir}/")