import type { ConfigType } from "@plone/registry";

export default function install(config: ConfigType) {
  // Multilingual: ca is default, plus es / en / fr / de.
  // Note: the GenericSetup profile language was 'es' at scaffolding time; the actual
  // site language is set to 'ca' via plone.app.multilingual after install.
  config.settings.isMultilingual = true;
  config.settings.supportedLanguages = ["ca", "es", "en", "fr", "de"];
  config.settings.defaultLanguage = "ca";

  return config;
}
