"""Fetch the minimal Pyodide runtime + sympy/mpmath wheels into <out>/pyodide/.

Self-hosting makes the engine load from the same origin as the page, which is
far more reliable than depending on public CDNs. The cache is shared with
LA Helper so repeated builds do not download ~20 MB again.
"""
import hashlib
import json
import os
import pathlib
import shutil
import sys
import tarfile
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
PYODIDE_VERSION = "0.26.2"
TARBALL_URLS = [
    f"https://registry.npmmirror.com/pyodide/-/pyodide-{PYODIDE_VERSION}.tgz",
    f"https://registry.npmjs.org/pyodide/-/pyodide-{PYODIDE_VERSION}.tgz",
]
RUNTIME_FILES = [
    "pyodide.js",
    "pyodide.asm.js",
    "pyodide.asm.wasm",
    "python_stdlib.zip",
    "pyodide-lock.json",
]
WHEELS = [
    {
        "name": "sympy",
        "file": "sympy-1.12-py3-none-any.whl",
        "sha256": "c3588cd4295d0c0f603d0f2ae780587e64e2efeedb3521e46b9bb1d08d184fa5",
        "path": "d2/05/e6600db80270777c4a64238a98d442f0fd07cc8915be2a1c16da7f2b9e74",
    },
    {
        "name": "mpmath",
        "file": "mpmath-1.3.0-py3-none-any.whl",
        "sha256": "a0b2b9fe80bbcd81a6647ff13108738cfb482d481d826cc0e02f5b35e5c88d2c",
        "path": "43/e3/7d92a15f894aa0c9c4b49b8ee9ac9850d6e63b03c9c32c0367a13ae62209",
    },
]
CACHE = pathlib.Path(
    os.environ.get("BC_PYODIDE_CACHE", pathlib.Path.home() / ".cache" / "la-pyodide")
)


def _download(urls, dest, min_size=1024):
    if dest.exists() and dest.stat().st_size >= min_size:
        print("  cache hit ", dest.name)
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    last_error = None
    for url in urls:
        try:
            print("  GET", url)
            req = urllib.request.Request(url, headers={"User-Agent": "bc-helper-build"})
            with urllib.request.urlopen(req, timeout=120) as resp, open(dest, "wb") as out:
                shutil.copyfileobj(resp, out)
            if dest.stat().st_size < min_size:
                raise IOError("too small")
            print("  ok  ", dest.name)
            return
        except Exception as exc:
            last_error = exc
            dest.unlink(missing_ok=True)
    raise SystemExit("all sources failed for " + dest.name + ": " + str(last_error))


def _sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    out = pathlib.Path(
        sys.argv[1] if len(sys.argv) > 1
        else os.environ.get("BC_PREVIEW_OUT", ROOT.parent / "bc-preview")
    )
    dest = out / "pyodide"
    dest.mkdir(parents=True, exist_ok=True)
    print("fetch pyodide", PYODIDE_VERSION, "->", dest)

    tarball = CACHE / f"pyodide-{PYODIDE_VERSION}.tgz"
    _download(TARBALL_URLS, tarball, min_size=1 << 20)
    with tarfile.open(tarball) as archive:
        for name in RUNTIME_FILES:
            member = archive.extractfile("package/" + name)
            if member is None:
                raise SystemExit(name + " missing from npm tarball")
            (dest / name).write_bytes(member.read())

    for wheel in WHEELS:
        urls = [
            "https://files.pythonhosted.org/packages/" + wheel["path"] + "/" + wheel["file"],
            "https://pypi.tuna.tsinghua.edu.cn/packages/" + wheel["path"] + "/" + wheel["file"],
        ]
        cached = CACHE / wheel["file"]
        _download(urls, cached, min_size=64 * 1024)
        digest = _sha256(cached)
        if digest != wheel["sha256"]:
            raise SystemExit(wheel["file"] + " sha256 mismatch")
        shutil.copyfile(cached, dest / wheel["file"])

    lock_path = dest / "pyodide-lock.json"
    lock = json.loads(lock_path.read_text(encoding="utf-8"))
    for wheel in WHEELS:
        lock["packages"][wheel["name"]]["sha256"] = wheel["sha256"]
    lock_path.write_text(json.dumps(lock, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    sizes = {p.name: p.stat().st_size for p in sorted(dest.iterdir()) if p.is_file()}
    (dest / "manifest.json").write_text(
        json.dumps({"total": sum(sizes.values()), "files": sizes}, indent=1), encoding="utf-8"
    )
    print("done:", len(sizes), "files,", sum(sizes.values()) // (1 << 20), "MB")


if __name__ == "__main__":
    main()
