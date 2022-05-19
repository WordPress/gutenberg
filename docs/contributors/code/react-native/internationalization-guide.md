# React Native Internationalization Guide

The native version of the editor references two types of string:
1. Strings used in web and native platforms.
2. Strings used only in the native platform.

Regarding the first type, these strings are translated following the same process described for the web version in [this guide](https://github.com/WordPress/gutenberg/blob/trunk/docs/how-to-guides/internationalization.md), however for the latter, it's required to provide your own translations.

## Extract strings only used in the native platform

In order to identify these strings, you can use the script [`extract-used-strings`](https://github.com/WordPress/gutenberg/blob/trunk/packages/react-native-editor/bin/extract-used-strings.js) located in `packages/react-native-editor/bin/extract-used-strings.js` to generate a JSON object that contains all the strings referenced including the platforms where they are used, as well as the files that reference it. Here you can see the format:
```
 {
	"gutenberg": {
	  "<string>": {
	    "string": String value.
		"stringPlural": String value with its plural form. [optional]
		"comments": Comments for translators. [default value is an empty string]
		"reference": Array containing the paths of the source files that reference the string.
		"platforms": Array containing the platforms where the string is being used, values are "android" | "ios" | "web".
	  },
	  ...
	},
	"other-domain-plugin": {
	  ...
	},
    ...
}
```

This command also supports passing extra plugins, in case the React Native bundle of the editor is generated including other plugins.

It's important to note that the JSON object contains all used strings, so in order to identify the ones only used in the native platform, it’s required to provide your own script/process to extract them. This can easily be done by going through the strings and filtering out the ones that include the "web" platform.

### NPM command

Extract used strings:
```sh
npm run native i18n:extract-used-strings -- "$PWD/used-strings.json"
```

***NOTE:** We need to pass absolute paths, otherwise it uses `packages/react-native-editor` as root path for relative paths.*

Extract used strings including extra plugins: 
```sh
npm run native i18n:extract-used-strings -- "$PWD/used-strings.json" "domain-plugin-1" <PLUGIN-1_SOURCE_PATH> "domain-plugin-2" <PLUGIN-2_SOURCE_PATH> ...
```

## Providing own translations (for strings only used in native platform)

Once you have the list of used strings in the native platform, the strings have to be translated, however, this process is out of the scope of the native version so you have to provide your own translations.

The process for injecting the translations data into the editor is via the `translations` initial prop which is passed to the editor during its initialization:
- [Android reference](https://github.com/WordPress/gutenberg/blob/72854b4d6b09bd7fb7f996a5c55dd3cc0613ddf8/packages/react-native-bridge/android/react-native-bridge/src/main/java/org/wordpress/mobile/WPAndroidGlue/GutenbergProps.kt#L34)
- [iOS reference](https://github.com/WordPress/gutenberg/blob/72854b4d6b09bd7fb7f996a5c55dd3cc0613ddf8/packages/react-native-bridge/ios/GutenbergBridgeDataSource.swift#L39-L43)

The mechanism for integrating the provided translations to the mobile client, via the mentioned `translations` initial prop, is not described here, as it's specific to the mobile client and could be achieved in different ways. Nevertheless, it's important that they're provided by the mentioned initial prop, as the editor is in charge of merging them with the translations already included in the editor.

**NOTE:** Keep in mind that those strings that match with ones already included in the editor will be overridden.

## Fetch translations (for strings used in web and native platforms)

A translation file is basically a JSON object that contains key-value items with the translation for each individual string. This content is fetched from [translate.wordpress.org](https://translate.wordpress.org/) that holds translations for WordPress and a list of different plugins like Gutenberg.

These files can be cached under a folder and optimized. Additionally, an index file is generated that acts as the entry point to import and fetches the plugin translations.

Fetched translations contain all the translatable plugin strings, including those not used in the native version of the editor. The file sizes, however, can be reduced by filtering out the strings not referenced in the used strings JSON file.

By default, when installing dependencies, un-optimized translations might be downloaded for Gutenberg and located in the `i18n-cache` folder if the cache is not present.

The strings included in these translation files are imported in the editor upon its initialization ([reference](https://github.com/WordPress/gutenberg/blob/154918b5770ac07c851169eaa35961c636eac5ba/packages/react-native-editor/src/index.js#L43-L49)) and will be merged with the extra translations provided by the `translations` initial prop.

### NPM command

Fetch un-optimized translations:
```sh
npm run native i18n:fetch-translations -- "gutenberg" <OUTPUT_PATH>
```

***NOTE:** We need to pass absolute paths, otherwise it uses `packages/react-native-editor` as root path  for relative paths.*

Fetch optimized translations:
```sh
npm run native i18n:fetch-translations -- "gutenberg" <OUTPUT_PATH> <USED_STRINGS_FILE>
```