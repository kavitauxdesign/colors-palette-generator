export interface LegacyScriptDefinition {
  id: string;
  code: string;
}

function injectLegacyScript(scriptDefinition: LegacyScriptDefinition) {
  if (document.querySelector(`script[data-legacy-script="${scriptDefinition.id}"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.dataset.legacyScript = scriptDefinition.id;
  script.text = `${scriptDefinition.code}\n//# sourceURL=${scriptDefinition.id}`;
  document.body.appendChild(script);
}

export function loadLegacyScripts(scripts: LegacyScriptDefinition[]) {
  scripts.forEach(injectLegacyScript);
}

export default loadLegacyScripts;
