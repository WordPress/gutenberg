# DataViews i18n

Message catalog for [`@wordpress/dataviews`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/dataviews).

`@wordpress/dataviews` is a _bundled_ package: it is compiled into whichever script imports it rather than being registered as a WordPress script of its own. A bundled package cannot translate its own strings, because gettext calls are attributed to the handle of the bundle they end up in, so WordPress has no handle to load translations for and every string stays in English.

This package solves that by holding the strings instead. It is registered as the `wp-dataviews-i18n` script, so WordPress loads its translations, and `@wordpress/dataviews` reads finished strings out of it.

You normally don't need to install or use this package directly. Use it if you want to look up which strings `@wordpress/dataviews` uses, or to add a new one.

See [`@wordpress/ui-i18n`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/ui-i18n/README.md) for the same catalog pattern applied to `@wordpress/ui`.

## Installation

Install the module

```bash
npm install @wordpress/dataviews-i18n --save
```

_This package assumes that your code will run in an ES2015+ environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Usage

The default export is the catalog. Keys are `SCREAMING_SNAKE_CASE`, values are functions that return the translated string:

```js
import i18n from '@wordpress/dataviews-i18n';

// Formerly `__( 'Reset' )`.
i18n.RESET();
```

Entries are functions rather than plain strings so that each gettext call runs only when that message is needed. A catalog of constants would resolve every message when the module loads, while a consumer displays a handful. The indirection also leaves room to resolve messages through something other than the global `__` later.

### What the catalog covers

The catalog holds what a translator needs: the source string, the translator context, the plural forms and the translator comment. It does not do the interpolation. An entry with placeholders returns the format string, and the caller applies `sprintf` where it always did:

```js
sprintf( i18n.ROW_NUMBER(), index + 1 ); // __( 'Row %d' )
```

Plural entries are the exception, because gettext needs the count to pick a form. They take that count and still return a format string, so the count is passed twice — once to choose the plural form, once to fill the placeholder:

```js
sprintf( i18n.ITEM_COUNT( items.length ), items.length ); // _n( '%d Item', '%d Items', … )
```

Entries with a context take no arguments, since the context belongs to the message rather than to the call:

```js
i18n.FILTER(); // _x( 'Filter', 'verb' )
```

Messages whose placeholders become elements work the same way, with `createInterpolateElement` wrapping the `sprintf`:

```js
createInterpolateElement(
	sprintf( i18n.FILTER_SUMMARY_IS(), filter.name, value ),
	{
		Name: <span className="…" />,
		Value: <span className="…" />,
	}
);
```

### Adding a message

1. Add an entry to `src/index.ts`, keeping the keys alphabetically sorted.
2. Add a `/* translators: … */` comment above any string with placeholders or an ambiguous meaning. That comment reaches translators, because it is extracted into the POT file; a doc comment on the entry does not.
3. Use the entry from `@wordpress/dataviews`. Do not call `__`, `_x`, `_n` or `_nx` there.

`isRTL` is a different matter: it reports the direction of the current locale rather than translating anything, so it does not depend on a script handle and `@wordpress/dataviews` keeps calling it directly.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose.

To find out more about contributing to this package or Gutenberg as a whole, please read the [project's main contributor guide](https://github.com/WordPress/gutenberg/blob/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
