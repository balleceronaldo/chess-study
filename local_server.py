from __future__ import annotations

import argparse
import mimetypes
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


mimetypes.add_type("application/wasm", ".wasm")


class CrossOriginIsolatedHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Serve the app locally with the headers needed for multi-threaded Stockfish WASM."
    )
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to.")
    parser.add_argument("--port", default=8000, type=int, help="Port to bind to.")
    parser.add_argument(
        "--dir",
        default=str(Path(__file__).resolve().parent),
        help="Directory to serve.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    class Handler(CrossOriginIsolatedHandler):
        def __init__(self, *handler_args, **handler_kwargs):
            super().__init__(*handler_args, directory=args.dir, **handler_kwargs)

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"Serving {args.dir} at http://{args.host}:{args.port}/")
    print("COOP/COEP headers are enabled for multi-threaded Stockfish.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
