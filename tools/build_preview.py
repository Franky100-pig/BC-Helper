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
             for name in ("index.html", "app.js", "bridge.js", "engine-worker.js",
                          "calc-engine.js", "desmos.js", "i18n.js", "notes.en.js",
                          "notes.js", "sw.js")}
    blob = json.dumps(core, ensure_ascii=False) + "".join(pages.values())
    version = hashlib.sha1(blob.encode("utf-8")).hexdigest()[:8]
    query = "?v=" + version

    (OUT / "core_bundle.js").write_text(
        "window.BC_CORE_FILES = " + json.dumps(core, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    html = pages["index.html"]
    for name in ("i18n.js", "core_bundle.js", "bridge.js", "app.js", "calc-engine.js",
                 "desmos.js", "notes.en.js", "notes.js"):
        html = html.replace(
            '<script src="' + name + '"></script>',
            '<script src="' + name + query + '"></script>',
        )
    (OUT / "index.html").write_text(html, encoding="utf-8")
    # 把带 ?v=hash 的真实资源 URL 注入 SW：页面缓存的是 build 后的 index.html，
    # 其中脚本全部带版本号；离线时这些带版本号的请求必须命中缓存，否则白屏。
    versioned = ["./" + name + query for name in
                 ("i18n.js", "core_bundle.js", "bridge.js", "engine-worker.js", "app.js",
                  "calc-engine.js", "desmos.js", "notes.en.js", "notes.js")]
    sw = pages["sw.js"].replace(
        "/*__BC_VERSIONED__*/[]/*__BC_VERSIONED_END__*/",
        "/*__BC_VERSIONED__*/" + json.dumps(versioned) + "/*__BC_VERSIONED_END__*/",
    )
    for name in ("app.js", "bridge.js", "engine-worker.js", "calc-engine.js",
                 "desmos.js", "i18n.js", "notes.en.js", "notes.js"):
        (OUT / name).write_text(pages[name], encoding="utf-8")
    (OUT / "sw.js").write_text(sw, encoding="utf-8")
    vendor = web / "vendor"
    if vendor.exists():
        shutil.copytree(vendor, OUT / "vendor", dirs_exist_ok=True)
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    print("built ->", OUT)
    print("core modules:", ", ".join(core))


if __name__ == "__main__":
    main()
