i18n
======

Internationalization utilities for client-side localization.

https://codex.wordpress.org/I18n_for_WordPress_Developers

## Usage

Include `wp-i18n` as a script dependency when [enqueueing](https://developer.wordpress.org/reference/functions/wp_enqueue_script/) or [registering](https://developer.wordpress.org/reference/functions/wp_register_script/) a script for your plugin.

```php
function myplugin_enqueue_scripts() {
	wp_enqueue_script( 'myplugin', plugins_url( 'script.js', __FILE__ ), array( 'wp-i18n' ) );
}
add_action( 'admin_enqueue_scripts', 'myplugin_enqueue_scripts' );
```

The script dependency will add a new `wp.i18n` object to your browser's global scope when loaded. In most cases you'll find parallels between [WordPress PHP localization functions](https://codex.wordpress.org/I18n_for_WordPress_Developers#Strings_for_Translation) and those on the `wp.i18n` object:

```js
wp.i18n.sprintf( wp.i18n._n( '%d hat', '%d hats', 4 ), 4 )
// 4 hats
```

Note that you will not need to specify [domain](https://codex.wordpress.org/I18n_for_WordPress_Developers#Text_Domains) for the strings.

## Build

Included is a [custom Babel plugin](./babel-plugin.js) which, when integrated into a Babel configuration, will scan all processed JavaScript files for use of localization functions. It then compiles these into a [gettext POT formatted](https://en.wikipedia.org/wiki/Gettext) file as a template for translation. By default the output file will be written to `gettext.pot` of the root project directory. This can be overridden using the `"output"` option of the plugin:

```json
[ "babel-plugin-wp-i18n", {
	"output": "languages/myplugin.pot"
} ]
```

If you include the `.pot` file in your project's repository, you should be sure to rebuild it with every commit that introduces or modifies localized strings. When handling merge conflicts on the `.pot` file, you can assume that simply rebuilding will generate a file that is up to date with the current files of the project.

## API

`wp.i18n.__( text: string ): string`

Retrieve the translation of text.

See: https://developer.wordpress.org/reference/functions/__/

`wp.i18n._x( text: string, context: string ): string`

Retrieve translated string with gettext context.

See: https://developer.wordpress.org/reference/functions/_x/

`wp.i18n._n( single: string, plural: string, number: Number ): string`

Translates and retrieves the singular or plural form based on the supplied number.

See: https://developer.wordpress.org/reference/functions/_n/

`wp.i18n._nx( single: string, plural: string, number: Number, context: string ): string`

Translates and retrieves the singular or plural form based on the supplied number, with gettext context.

See: https://developer.wordpress.org/reference/functions/_nx/

`wp.i18n.sprintf( format: string, ...args: mixed[] ): string`

Returns a formatted string.

See: http://www.diveintojavascript.com/projects/javascript-sprintf

`wp.i18n.setLocaleData( data: Object )`

Creates a new Jed instance with specified locale data configuration.

`wp.i18n.getI18n(): Jed`

Returns the current Jed instance, initializing with a default configuration if not already assigned.

See: http://messageformat.github.io/Jed/
