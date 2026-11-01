"""Create the Chrome Web Store ZIP, without developer docs or screenshots."""
import json
from pathlib import Path
import sys
from zipfile import ZIP_DEFLATED, ZipFile

source = Path(__file__).resolve().parents[1] / 'extensions' / 'lookbox-orders'
manifest = json.loads((source / 'manifest.json').read_text())
files = ['manifest.json', 'background.js', 'extract.js', 'platforms.js', 'lookbox-bridge.js']
files += sorted(set(manifest['icons'].values()))
destination = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path('/tmp')
destination.mkdir(parents=True, exist_ok=True)
archive = destination / f"realcloset-orders-{manifest['version']}.zip"
with ZipFile(archive, 'w', ZIP_DEFLATED) as package:
    for name in files:
        package.write(source / name, name)
with ZipFile(archive) as package:
    assert package.testzip() is None
    assert set(package.namelist()) == set(files)
    assert json.loads(package.read('manifest.json'))['manifest_version'] == 3
print(archive)
