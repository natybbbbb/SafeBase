const fs = require("fs");
const path = require("path");

function isAddress(a) {
  return typeof a === "string" && /^0x[0-9a-fA-F]{40}$/.test(a);
}

function eq(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

function validateFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  const proxy = String(data.proxy || "").trim();
  const implementation = String(data.implementation || "").trim();
  if (!isAddress(proxy)) throw new Error(`invalid proxy in ${file}: ${proxy}`);
  if (!isAddress(implementation)) throw new Error(`invalid implementation in ${file}: ${implementation}`);
  if (eq(proxy, implementation)) throw new Error(`proxy equals implementation in ${file}`);
}

(function main() {
  const dir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(dir)) throw new Error("deployments directory not found");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) throw new Error("no deployment json files");
  files.forEach((f) => validateFile(path.join(dir, f)));
  console.log("deployments validation ok");
})();
