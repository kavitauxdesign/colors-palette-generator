const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const templatePath = path.join(projectRoot, "html", "index.template.html");
const outputPath = path.join(projectRoot, "index.html");

const partials = {
  "{{PALETTE_GENERATOR_APP}}": path.join(projectRoot, "html", "apps", "palette-generator.html"),
  "{{HEX_TO_FILTER_APP}}": path.join(projectRoot, "html", "apps", "hex-to-filter.html"),
};

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
