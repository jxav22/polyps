/**
 * Headless preview frames → media/ (requires chrome + local demo server).
 *   node export-preview.mjs [demoUrl]
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mediaDir = "/cursor/stores/self/media";
const port = 5199;

const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};

async function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = (req.url || "/").split("?")[0];
      const path = url === "/" ? "/demo.html" : url;
      const file = join(__dirname, path);
      const data = await readFile(file);
      res.writeHead(200, { "Content-Type": mime[extname(file)] || "text/plain" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("missing");
    }
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  return server;
}

async function screenshot(url, outPath) {
  const chrome =
    process.env.CHROME_PATH ||
    "/usr/bin/google-chrome" ||
    "google-chrome";
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1280,720",
    `--screenshot=${outPath}`,
    url,
  ];
  await new Promise((resolve, reject) => {
    const p = spawn(chrome, args, { stdio: "inherit" });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("chrome " + code))));
  });
}

await mkdir(mediaDir, { recursive: true });
const server = await serve();
const url = `http://127.0.0.1:${port}/demo.html`;
const out = join(mediaDir, "polyps-colony-preview.png");
try {
  await screenshot(url, out);
  const st = await stat(out);
  console.log("wrote", out, st.size);
  await writeFile(
    join(mediaDir, "polyps-colony-preview.txt"),
    `Preview captured from ${url}\n`
  );
} finally {
  server.close();
}
