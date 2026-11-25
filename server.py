#!/usr/bin/env python3
"""
Simple Portfolio Development Server with Wishes JSON API
Run with: python3 server.py [port]
Default port: 8000
"""

import http.server
import json
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "wishes.json")

class PortfolioHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/wishes"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            if os.path.exists(DATA_PATH):
                with open(DATA_PATH, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"[]")
            return
        super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/wishes"):
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            try:
                parsed = json.loads(post_data.decode("utf-8"))
                os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
                                formatted = json.dumps(parsed, indent=2, ensure_ascii=False)
                with open(DATA_PATH, "w", encoding="utf-8") as f:
                    f.write(formatted)
                                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(b'{"status":"ok","message":"Wishes saved to JSON successfully"}')
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(f'{{"error":"{str(e)}"}}'.encode("utf-8"))
            return
        super().do_POST()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

if __name__ == "__main__":
    server_address = ("", PORT)
    httpd = http.server.HTTPServer(server_address, PortfolioHandler)
    print(f"Portfolio server running at http://localhost:{PORT}")
    print(f"Direct Wishes JSON API active at http://localhost:{PORT}/api/wishes")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
