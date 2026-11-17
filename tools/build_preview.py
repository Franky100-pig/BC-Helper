"""Build a static BC Helper preview with the SymPy engine bundled for Pyodide."""
import hashlib
import json
import os
import pathlib
import re
import shutil

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = pathlib.Path(os.environ.get("BC_PREVIEW_OUT", ROOT.parent / "bc-preview"))


def bundle_core():
    files = {}
    for path in sorted((ROOT / "core").glob("*.py")):
        if path.name == "__init__.py":
            continue
        src = path.read_text(encoding="utf-8")
        src = re.sub(r"^(\s*)from \.(\w+) import", r"\1from \2 import", src, flags=re.M)
        src = re.sub(r"^(\s*)from \. import", r"\1import", src, flags=re.M)
        files[path.name] = src
    return files


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    core = bundle_core()
    web = ROOT / "web"
    pages = {name: (web / name).read_text(encoding="utf-8")
             for name in ("index.html", "app.js", "bridge.js", "calc-engine.js", "desmos.js", "sw.js")}
    blob = json.dumps(core, ensure_ascii=False) + "".join(pages.values())
    version = hashlib.sha1(blob.encode("utf-8")).hexdigest()[:8]
    query = "?v=" + version

    (OUT / "core_bundle.js").write_text(
        "window.BC_CORE_FILES = " + json.dumps(core, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    html = pages["index.html"]
    for name in ("core_bundle.js", "bridge.js", "app.js", "calc-engine.js", "desmos.js"):
        html = html.replace(
            '<script src="' + name + '"></script>',
            '<script src="' + name + query + '"></script>',
        )
    (OUT / "index.html").write_text(html, encoding="utf-8")
    for name in ("app.js", "bridge.js", "sw.js", "calc-engine.js", "desmos.js"):
        (OUT / name).write_text(pages[name], encoding="utf-8")
    vendor = web / "vendor"
    if vendor.exists():
        shutil.copytree(vendor, OUT / "vendor", dirs_exist_ok=True)
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    print("built ->", OUT)
    print("core modules:", ", ".join(core))


if __name__ == "__main__":
    main()
