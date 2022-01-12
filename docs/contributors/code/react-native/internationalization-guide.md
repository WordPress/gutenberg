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

Filtering from this data the strings that doesn't include the "web" platform, it will provide the list of strings that are required to be translated. Once the translations for these strings are ready, they can be injected into the editor via the `translations` initial prop when it’s initialized:
- [Android reference](https://github.com/WordPress/gutenberg/blob/72854b4d6b09bd7fb7f996a5c55dd3cc0613ddf8/packages/react-native-bridge/android/react-native-bridge/src/main/java/org/wordpress/mobile/WPAndroidGlue/GutenbergProps.kt#L34)
- [iOS reference](https://github.com/WordPress/gutenberg/blob/72854b4d6b09bd7fb7f996a5c55dd3cc0613ddf8/packages/react-native-bridge/ios/GutenbergBridgeDataSource.swift#L39-L43)

The translations passed through this initial prop will be merged with the ones already included in the editor.

### NPM command

Extract used strings:
```sh
npm run native i18n:extract-used-strings -- "$PWD/used-strings.json"
```

***NOTE:** We need to pass absolute paths, otherwise it uses `packages/react-native-editor` as root path  for relative paths.*

Extract used strings including extra plugins: 
```sh
npm run native i18n:extract-used-strings -- "$PWD/used-strings.json" "domain-plugin-1" <PLUGIN-1_SOURCE_PATH> "domain-plugin-2" <PLUGIN-2_SOURCE_PATH> ...
```

## Fetch translations

A translation file is basically a JSON object that contains key-value items with the translation for each individual string. This content is fetched from [translate.wordpress.org](https://translate.wordpress.org/) that holds translations for WordPress and a list of different plugins like Gutenberg.

These files can be cached under a folder and can be optimized, additionally, an index file (`index.js`) is generated that acts as the entry point to import and get translations of the plugin.

Fetched translations contain all the strings of the plugin, including strings that are not used in the native version of the editor, however, and in order to reduce their file size, they can be optimized by filtering out the strings that aren't referenced in the used strings JSON file.

By default, when installing dependencies, un-optimized translations might be downloaded for Gutenberg and located in the `i18n-cache` folder if the cache is not present.

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