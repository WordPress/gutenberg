# Internationalization

This document aims to give an overview of the possibilities for both internationalization and localization when developing with WordPress.

## PHP

For years, WordPress has been providing the necessary tools and functions to internationalize plugins and themes. This includes helper functions like `__()` and similar.

### Common Methods

- `__( 'Hello World', 'my-text-domain' )`: Translate a certain string.
- `_x( 'Block', 'noun', 'my-text-domain' )`: Translate a certain string with some additional context.
- `_e( 'Hello World', 'my-text-domain' )`: Translate and print a certain string.
- `esc_html__( 'Hello World', 'my-text-domain' )`: Translate a certain string and escape it for safe use in HTML output.
- `esc_html_e( 'Hello World', 'my-text-domain' )`: Translate a certain string, escape it for safe use in HTML output, and print it.
- `_n( '%s Comment', '%s Comments', $number, 'my-text-domain' )`: Translate and retrieve the singular or plural form based on the supplied number.
  Usually used in combination with `sprintf()` and `number_format_i18n()`.

## JavaScript

Historically, `wp_localize_script()` has been used to put server-side PHP data into a properly-escaped native JavaScript object.

The new editor introduces a new approach to translating strings for the editor through a new package called `@wordpress/i18n`.

The new script package is registered with WordPress as `wp-i18n` and should be declared as a dependency during `wp_register_script()` and imported as a global off the Window object as `wp.i18n`.

Depending on your developer workflow, you might want to use WP-CLI's `wp i18n make-pot` command or a build tool for Babel called `@wordpress/babel-plugin-makepot` to create the necessary translation file. The latter approach integrates with Babel to extract the I18N methods.

### Common methods in wp.i18n (may look similar)

- `setLocaleData( data: Object, domain: string )`: Creates a new I18N instance providing translation data for a domain.
- `__( 'Hello World', 'my-text-domain' )`: Translate a certain string.
- `_n( '%s Comment', '%s Comments', numberOfComments, 'my-text-domain' )`: Translate and retrieve the singular or plural form based on the supplied number.
- `_x( 'Default', 'block style', 'my-text-domain' )`: Translate a certain string with some additional context.
- `sprintf()`: JavaScript port of the PHP function with the same name.

### Loading Translations

WordPress 5.0 introduces a new function called `wp_set_script_translations( 'my-script-handle', 'my-text-domain' )` to load translation files for a given script handle.

You can learn more about it in [the JavaScript I18N dev note](https://make.wordpress.org/core/2018/11/09/new-javascript-i18n-support-in-wordpress/).

## More Resources

- [WP-CLI I18N command to generate translation catalogues](https://github.com/wp-cli/i18n-command)
- [Plugin Developer Handbook](https://developer.wordpress.org/plugins/internationalization/)
- [Theme Developer Handbook](https://developer.wordpress.org/themes/internationalization/)
