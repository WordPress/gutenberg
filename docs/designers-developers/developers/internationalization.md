# Internationalization

## What is Internationalization?

Internationalization is the process to provide multiple language support to software, in this case WordPress. Internationalization is often abbreviated as **i18n**, where 18 stands for the number of letters between the first _i_ and the last _n_.

Providing i18n support to your plugin and theme allows it to reach the largest possible audience, even without requiring you to provide the additional language translations.  When you upload your software to WordPress.org, all JS and PHP files will automatically be parsed. Any detected translation strings are added to [translate.wordpress.org](https://translate.wordpress.org/) to allow the community to translate, ensuring WordPress plugins and themes are available in as many languages as possible.

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

{% codetabs %}
{% ES5 %}
```js
const { __ } = wp.i18n;
const el = wp.element.createElement;
const { registerBlockType } = wp.blocks;

registerBlockType( 'myguten/simple', {
	title: __( 'Simple Block', 'myguten' ),
	category: 'widgets',

	edit: () => {
		return el(
			'p',
			{ style: { color: 'red' } },
			__( 'Hello World', 'myguten' )
		);
	},

	save: () => {
		return el(
			'p',
			{ style: { color: 'red' } },
			__( 'Hello World', 'myguten' )
		);
	},
} );
```
{% ESNext %}
```js
import { __ } from '@wordpress/i18n';
import { registerBlockType } from '@wordpress/blocks';

registerBlockType( 'myguten/simple', {
	title: __( 'Simple Block', 'myguten' ),
	category: 'widgets',

	edit: () => {
		return (
			<p style="color:red">
				{ __( 'Hello World', 'myguten' ) }
			</p>
		);
	},

	save: () => {
		return (
			<p style="color:red">
				{ __( 'Hello World', 'myguten' ) }
			</p>
		);
	},
} );
```
{% end %}

In the above example, the function will use the first argument for the string to be translated. The second argument is the text domain which must match the text domain slug specified by your plugin.

Common functions available, these mirror their PHP counterparts are:

- `__( 'Hello World', 'my-text-domain' )` - Translate a certain string.
- `_n( '%s Comment', '%s Comments', numberOfComments, 'my-text-domain' )` - Translate and retrieve the singular or plural form based on the supplied number.
- `_x( 'Default', 'block style', 'my-text-domain' )` - Translate a certain string with some additional context.

**Note:** Every string displayed to the user should be wrapped in an i18n function.

After all strings in your code is wrapped, the final step is to tell WordPress your JavaScript contains translations, using the [wp_set_script_translations()](https://developer.wordpress.org/reference/functions/wp_set_script_translations/) function.

```php
<?php
	function myguten_set_script_translations() {
		wp_set_script_translations( 'myguten-script', 'myguten' );
	}
	add_action( 'init', 'myguten_set_script_translations' );
```

This is all you need to make your plugin JavaScript code translatable.

When you set script translations for a handle WordPress will automatically figure out if a translations file exists on translate.wordpress.org, and if so ensure that it's loaded into `wp.i18n` before your script runs.  With translate.wordpress.org, plugin authors also do not need to worry about setting up their own infrastructure for translations and can rely on a global community with dozens of active locales. Read more about [WordPress Translations](https://make.wordpress.org/meta/handbook/documentation/translations/).

## Provide Your Own Translations

You can create and ship your own translations with your plugin, if you have sufficient knowledge of the language(s) you can ensure the translations are available.

### Create Translation File

The translation files must be in the JED 1.x JSON format.

To create a JED translation file, first you need to extract the strings from the text. Typically, the language files all live in a directory called `languages` in your plugin.  Using [WP-CLI](https://wp-cli.org/), you create a `.pot` file using the following command from within your plugin directory:

```
mkdir languages
wp i18n make-pot ./ languages/myguten.pot
```

This will create the file `myguten.pot` which contains all the translatable strings from your project.

```
msgid ""
msgstr ""
"Project-Id-Version: Scratch Plugin\n"
"Report-Msgid-Bugs-To: https://wordpress.org/support/plugin/scratch\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\n"
"Language-Team: LANGUAGE <LL@li.org>\n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"POT-Creation-Date: 2019-03-08T11:26:56-08:00\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\n"
"X-Generator: WP-CLI 2.1.0\n"
"X-Domain: myguten\n"

#. Plugin Name of the plugin
msgid "Scratch Plugin"
msgstr ""

#: block.js:6
msgid "Simple Block"
msgstr ""

#: block.js:13
#: block.js:21
msgid "Hello World"
msgstr ""
```

Here, `msgid` is the string to be translated, and `msgstr` is the actual translation. In the POT file, `msgstr` will always be empty.

This POT file can then be used as the template for new translations. You should **copy the file** using the language code you are going to translate, this example will use the Esperanto (eo) language:

```
cp myguten.pot myguten-eo.po
```

For this simple example, you can simply edit the `.po` file in your editor and add the translation to all the `msgstr` sets. For a larger, more complex set of translation, the [GlotPress](https://glotpress.blog/) and [Poedit](https://poedit.net/) tools exist to help.

You need also to add the `Language: eo` parameter. Here is full `myguten-eo.po` translated file

```
# Copyright (C) 2019
# This file is distributed under the same license as the Scratch Plugin plugin.
msgid ""
msgstr ""
"Project-Id-Version: Scratch Plugin\n"
"Report-Msgid-Bugs-To: https://wordpress.org/support/plugin/scratch\n"
"Last-Translator: Marcus Kazmierczak <marcus@mkaz.com>\n"
"Language-Team: Esperanto <marcus@mkaz.com>\n"
"Language: eo\n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"POT-Creation-Date: 2019-02-18T07:20:46-08:00\n"
"PO-Revision-Date: 2019-02-18 08:16-0800\n"
"X-Generator: Poedit 2.2.1\n"
"X-Domain: myguten\n"

#. Plugin Name of the plugin
msgid "Scratch Plugin"
msgstr "Scratch kromprogrameto"

#: block.js:6
msgid "Simple Block"
msgstr "Simpla bloko"

#: block.js:13 block.js:21
msgid "Hello World"
msgstr "Saltuon mundo"
```

The last step to create the translation file is to convert the `myguten-eo.po` to the JSON format needed. For this, you can use WP-CLI's [`wp i18n make-json` command](https://developer.wordpress.org/cli/commands/i18n/make-json/), which requires WP-CLI v2.2.0 and later.

```
wp i18n make-json myguten-eo.po --no-purge
```

This will generate the JSON file `myguten-eo-[md5].json` with the contents:

```json
{
  "translation-revision-date": "2019-04-26T13:30:11-07:00",
  "generator": "WP-CLI/2.2.0",
  "source": "block.js",
  "domain": "messages",
  "locale_data": {
    "messages": {
      "": {
        "domain": "messages",
        "lang": "eo",
        "plural-forms": "nplurals=2; plural=(n != 1);"
      },
      "Simple Block": [
        "Simpla Bloko"
      ],
      "Hello World": [
        "Salunton mondo"
      ]
    }
  }
}
```


### Load Translation File

The final part is to tell WordPress where it can look to find the translation file. The `wp_set_script_translations` function accepts an optional third argument that is the path it will first check for translations. For example:

```php
<?php
	function myguten_set_script_translations() {
		wp_set_script_translations( 'myguten-script', 'myguten', plugin_dir_path( __FILE__ ) . 'languages' );
	}
	add_action( 'init', 'myguten_set_script_translations' );
```

WordPress will check for a file in that path with the format `${domain}-${locale}-${handle}.json` as the source of translations. Alternatively, instead of the registered handle you can use the md5 hash of the relative path of the file, `${domain}-${locale} in the form of ${domain}-${locale}-${md5}.json.`

Using `make-json` automatically names the file with the md5 hash, so it is ready as-is. You could rename the file to use the handle instead, in which case the file name would be `myguten-eo-myguten-script.json`.

### Test Translations

You will need to set your WordPress installation to Esperanto language. Go to Settings > General and change your site language to Esperanto.

With the language set, create a new post, add the block, and you will see the translations used.
