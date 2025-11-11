import fs from "fs";
import path from "path";
import { getAddress } from "ethers";

function validateFile(file: string) {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  const proxy = String(data.proxy || "").trim();
  const implementation = String(data.implementation || "").trim();
  if (!proxy) throw new Error(`proxy missing in ${file}`);
  if (!implementation) throw new Error(`implementation missing in ${file}`);
  const p = getAddress(proxy);
  const i = getAddress(implementation);
  if (p.toLowerCase() === i.toLowerCase()) throw new Error(`proxy equals implementation in ${file}`);
}

function main() {
  const dir = path.join(process.cwd(), "deployments");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  if (files.length === 0) throw new Error("no deployment files");
  files.forEach(f => validateFile(path.join(dir, f)));
  console.log("deployments validation ok");
}

main();
