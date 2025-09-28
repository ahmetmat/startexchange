# smart_contracts/scripts/build_artifacts.py

import sys
from pathlib import Path

# Proje kökünü ve smart_contracts paketini PATH'e ekle
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent  # smart_contracts/
sys.path.insert(0, str(ROOT))

# Uygulama importları
from startup_registry.startup_registry_app import app as registry_app
# from competition_app import app as competition_app  # varsa açabilirsin

def export_app(beaker_app, out_dir: Path):
    """
    Belirtilen Beaker app'i derler ve artifacts klasörüne TEAL + spec json export eder.
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    # ApplicationSpecification nesnesini al
    spec = beaker_app.build()

    # TEAL ve JSON çıktıları üret
    # approval.teal, clear.teal ve application.json dosyaları çıkar
    spec.export(str(out_dir))

    print(f"✓ Exported {beaker_app.name} -> {out_dir}")

def main():
    artifacts = ROOT / "artifacts"

    # Her app için ayrı klasör
    export_app(registry_app, artifacts / "startup_registry")
    # export_app(competition_app, artifacts / "competition_app")

    print(f"\nArtifacts exported under: {artifacts}")

if __name__ == "__main__":
    main()