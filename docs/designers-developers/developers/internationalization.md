# Internationalization

## PHP

WordPress has long offered a number of ways to create translatable strings in PHP.

### Common methods

- `__( $string_to_translate, $text_domain )` - translatable string wrapper, denoting translation namespace
- `_e( $string_to_translate, $text_domain )` - transltable string wrapper, with echo to print.
- `esc_html__( $string_to_translate, $text_domain )` - escapes and returns translation
- `esc_html_e( $string_to_translate, $text_domain )` - escapes, translates, and prints
- `_n( $singular, $plural, $number, $text_domain )` - Translatable singular/plural string, using %d to inject changing number digit.

### More Resources

- i18n for Developers - Covers numbers in translatable strings, best practices.
- WP-CLI can be used to generate translation files.

## JavaScript

Historically, `wp_localize_script()` has been used to put server-side PHP data into a properly-escaped native JavaScript object.

The new editor introduces a new approach to translating strings for the editor through a new package called `@wordpress/i18n` and a build tool for Babel called `@wordpress/babel-plugin-makepot` to create the necessary translation file (requires use of babel to compile code to extract the i18n methods).

The new script package is registered with WordPress as `wp-i18n` and should be declared as a dependency during `wp_register_script()` and imported as a global off the Window object as `wp.i18n`.

### Common methods in wp.i18n (may look similar)

- `setLocaleData( data: Object, domain: string )` - Create new Jed instance providing translation data for a domain (probably writing this to the DOM in escaped in PHP function).
- `__( stringToTranslate, textDomain )` - translatable string wrapper, denoting translation namespace
- `_n( singular, plural, number, textDomain )` - Translatable singular/plural string, using %d to inject changing number digit.
- `_x( singular, plural, number, textDomain )` - gettext equivalent for translation
