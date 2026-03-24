const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const templatePath = path.join(projectRoot, "html", "index.template.html");
const outputPath = path.join(projectRoot, "index.html");
const packageJsonPath = path.join(projectRoot, "package.json");

const partials = {
  "{{PALETTE_GENERATOR_APP}}": path.join(projectRoot, "html", "apps", "palette-generator.html"),
  "{{HEX_TO_FILTER_APP}}": path.join(projectRoot, "html", "apps", "hex-to-filter.html"),
};

function getAppVersionLabel() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const rawVersion = String(packageJson.version || "").trim();

  if (!rawVersion) {
    throw new Error("Missing version in package.json.");
  }

  const prereleaseMatch = rawVersion.match(/^(\d+\.\d+\.\d+)-([a-zA-Z]+)(?:\.\d+)?$/);

  if (prereleaseMatch) {
    const [, version, channel] = prereleaseMatch;
    return `${version} (${channel.toLowerCase()})`;
  }

  return rawVersion;
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8").trim();
}

function buildIndexHtml() {
  let template = readFile(templatePath);

  Object.entries(partials).forEach(([placeholder, partialPath]) => {
    if (!template.includes(placeholder)) {
      throw new Error(`Missing placeholder ${placeholder} in ${path.relative(projectRoot, templatePath)}.`);
    }

    template = template.replace(placeholder, readFile(partialPath));
  });

  template = template.replaceAll("{{APP_VERSION_LABEL}}", getAppVersionLabel());

  if (/\{\{[A-Z_]+\}\}/.test(template)) {
    throw new Error("Not all HTML partial placeholders were replaced.");
  }

  const banner = [
    "<!-- Generated file: edit html/index.template.html and html/apps/*.html,",
    "     then run `node scripts/build-index.js`. -->",
  ].join("\n");

  return template.replace("<!doctype html>", `<!doctype html>\n${banner}`) + "\n";
}

fs.writeFileSync(outputPath, buildIndexHtml(), "utf8");
console.log(`Built ${path.relative(projectRoot, outputPath)}.`);
