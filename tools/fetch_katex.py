"""Fetch KaTeX into web/vendor/katex so formulas render without a CDN."""
import os
import pathlib
import shutil
import tarfile
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
VERSION = "0.16.11"
DEST = ROOT / "web" / "vendor" / "katex"
CACHE = pathlib.Path(os.environ.get("BC_KATEX_CACHE", pathlib.Path.home() / ".cache" / "bc-katex"))
URLS = [
    f"https://registry.npmmirror.com/katex/-/katex-{VERSION}.tgz",
    f"https://registry.npmjs.org/katex/-/katex-{VERSION}.tgz",
]


def main():
    if (DEST / "katex.min.js").exists() and (DEST / "katex.min.css").exists():
        print("KaTeX already present:", DEST)
        return
    CACHE.mkdir(parents=True, exist_ok=True)
    tarball = CACHE / f"katex-{VERSION}.tgz"
    if not tarball.exists():
        for url in URLS:
            try:
                print("GET", url)
                with urllib.request.urlopen(url, timeout=120) as resp:
                    tarball.write_bytes(resp.read())
                break
            except Exception as exc:
                print("  fail:", exc)
        else:
            raise SystemExit("all KaTeX sources failed")
    DEST.mkdir(parents=True, exist_ok=True)
    with tarfile.open(tarball) as archive:
        for member in archive.getmembers():
            if not member.name.startswith("package/dist/"):
                continue
            relative = member.name[len("package/dist/"):]
            if not relative:
                continue
            target = DEST / relative
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
            elif member.isfile():
                target.parent.mkdir(parents=True, exist_ok=True)
                source = archive.extractfile(member)
                if source:
                    target.write_bytes(source.read())
    print("KaTeX ready:", DEST)


if __name__ == "__main__":
    main()
