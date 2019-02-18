# Internationalization

## What is Internationalization?

Internationalization is the process to provide multiple language support to software, in this case WordPress. Internationalization is often abbreviated as **i18n**, where 18 stands for the number of letters between the first _i_ and the last _n_.

Providing i18n support to your plugin and theme allows it to reach the largest possible audience, even without requiring you to provide the additional language translations.  When you upload your software to wordpress.org, all JS and PHP files will automatically be parsed. Any detected translation strings are added to translate.wordpress.org to allow the community to translate, ensuring WordPress plugins and themes are available in as many languages as possible.

For PHP, WordPress has a long established process, see [How to Internationalize Your Plugin](https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/). The release of WordPress 5.0 brings a similar process for translation to JavaScript code.

## How to use i18n in JavaScript

WordPress 5.0 introduced the wp-i18n JavaScript package that provides the functions needed to add translatable strings as you would in PHP.

First, add **wp-i18n** as a dependency when registering your script:

```php
<?php
/**
 * Plugin Name: Myguten Plugin
 * Text Domain: myguten
 */
function myguten_block_init() {
    wp_register_script(
        'myguten-script',
        plugins_url( 'block.js', __FILE__ ),
        array( 'wp-blocks', 'wp-element', 'wp-i18n' )
    );

    register_block_type( 'myguten/simple', array(
        'editor_script' => 'myguten-script',
    ) );
}
add_action( 'init', 'myguten_block_init' );
```

In your code, you can include the i18n functions. The most common function is **__** (a double underscore) which provides translation of a simple string. Here is a basic static block example, this is in a file called `block.js`:

```js
const { __ } = wp.i18n;
const el = wp.element.createElement;
const { registerBlockType } = wp.blocks;

registerBlockType( 'myguten/simple', {
	title: __('Simple Block', 'myguten'),
	category: 'widgets',

	edit: () => {
		return el(
			'p',
			{ style: { color:'red'}, },
			__('Hello World', 'myguten')
		);
	},

	save: () => {
		return el(
			'p',
			{ style: { color:'red'}, },
			__('Hello World', 'myguten')
		);
	}
});
```

In the above example, the function will use the first argument for the string to be translated. The second argument is the text domain which must match the text domain slug specified by your plugin.

Common functions available, these mirror their PHP counterparts are:

- `__( 'Hello World', 'my-text-domain' )` - Translate a certain string.
- `_n( '%s Comment', '%s Comments', numberOfComments, 'my-text-domain' )` - Translate and retrieve the singular or plural form based on the supplied number.
- `_x( 'Default', 'block style', 'my-text-domain' )` - Translate a certain string with some additional context.

**Note:** Every string displayed to the user should be wrapped in an i18n function.

After all strings in your code is wrapped, the final step is to tell WordPress your JavaScript contains translations, using the [wp_set_script_translations()](https://developer.wordpress.org/reference/functions/wp_set_script_translations/) function.

```php
<?php
	...

	// Added in init action
	// Uses script handle defined in register
	wp_set_script_translations( 'myguten-script', 'myguten' );
```

This is all you need to make your plugin JavaScript code translatable.

When you set script translations for a handle WordPress will automatically figure out if a translations file exists on translate.wordpress.org, and if so ensure that it's loaded into wp.i18n before your script runs.  With translate.wordpress.org, plugin authors also do not need to worry about setting up their own infrastructure for translations and can rely on a global community with dozens of active locales.  Read more about [WordPress Translations](https://make.wordpress.org/meta/handbook/documentation/translations/).

## Provide Your Own Translations

You can create and ship your own translations with your plugin, if you have sufficient knowledge of the language(s) you can ensure the translations are available.

### Create Translation File

The translation files must be in the JED 1.x JSON format.

To create a JED translation file, first you need to extract the strings from the text.
Using the [wp-cli tool](https://wp-cli.org/), you create a `.pot` file using the following command from within your plugin directory:

```
wp i18n make-pot ./
```

This will create the file `myguten.pot` a pot file is a template file to be used for translating to different languages. The pot file is made up of translation sets, for example:

```
#: block.js:6
msgid "Simple Block"
msgstr ""
```

The `msgid` is the string to be translated, and `msgstr` is the translated string, which in the pot file the msgstr will be empty.

A po file is then created from this template, which is the same format, but the translations filled in. You should copy the file using the language code you are going to translate, this example will use the Esperanto (eo) language:

```
cp myguten.pot myguten-eo.po
```

You then go through the `.po` file and add the translation to all the `msgstr` sets:

```
#: block.js:6
msgid "Simple Block"
msgstr "Simpla bloko"
```


The last step to create the translation file is to convert the `myguten-eo.po` to the JSON format needed. For this, you use the [po2json utility](https://github.com/mikeedwards/po2json) which you can install using npm. It might be easiest to install globally using: `npm install -g po2json`. Once installed, use the following command to convert to JED format:

```
po2json myguten-eo.po myguten-eo.json -f jed
```

### Load Translation File

The final part is to tell WordPress where it can look to find the translation file. The `wp_set_script_translations` function accepts an optional third argument that is the path it will first check for translations. For example:

```php
<?php
	// added in init action
	wp_set_script_translations( 'myguten-script', 'myguten', plugin_dir_path( __FILE__ ) . 'languages' );
```

WordPress will check for a file in that path with the format `${domain}-${locale}-${handle}.json` as the source of translations.

So you should create a directory called `languages` and move the `myguten-eo.json` file there, the handle in the file name is the same handle for the script that needs translating, `myguten-script` in this example:

```
mkdir languages
mv myguten-eo.json myguten-eo-myguten-script.json
```

You will need to set your WordPress installation to Esperanto language, you can do so in Settings > General and change your site language to Esperanto. This may require you add `define( 'WPLANG', 'eo' );` to your wp-config.php.

With the language set, you can create a new block which will use the translations.

