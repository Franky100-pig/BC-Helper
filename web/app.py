"""本地开发服务器：提供 web/ 静态文件，并把 /api/compute 交给共享 core。"""
import functools
import json
import pathlib
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "core"))


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/api/compute":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(length).decode("utf-8"))
        import engine
        result = engine.dispatch(payload)
        body = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8124
    handler = functools.partial(Handler, directory=str(ROOT / "web"))
    print(f"BC Helper dev server: http://127.0.0.1:{port}")
    HTTPServer(("127.0.0.1", port), handler).serve_forever()


if __name__ == "__main__":
    main()
