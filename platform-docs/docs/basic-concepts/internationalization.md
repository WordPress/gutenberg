---
sidebar_position: 7
---

# Internationalization

The Gutenberg block editor uses the `@wordpress/i18n` package to provide internationalization support.

Translations can be provided by calling the `setLocaleData` function with a domain and a locale data object. The locale data object should be in the [Jed-formatted JSON object shape](http://messageformat.github.io/Jed/).

```js
import { setLocaleData } from '@wordpress/i18n';

setLocaleData( { 'Type / to choose a block': [ 'Taper / pour choisir un bloc' ] } );
```

# RTL Support

By default, the Gutenberg UI is optimized for left-to-right (LTR) languages. But Gutenberg scripts and styles include support for right-to-left (RTL) languages as well. To enable RTL support, we need to perform a few actions:

First, we need to define that our locale is RTL using `@wordpress/i18n`.

```js
import { setLocaleData } from '@wordpress/i18n';

setLocaleData( { 'text direction\u0004ltr': [ 'rtl' ] } );
```

Second, we need to load the RTL CSS stylesheets instead of the LTR ones. For each of the stylesheets that you load from `@wordpress` packages, there's an RTL version that you can use instead.

For example, when loading the `@wordpress/components` stylesheet, you can load the RTL version by using `@wordpress/components/build-style/style-rtl.css` instead of `@wordpress/components/build-style/style.css`.

Finally, make sure to add a `dir` property to the `html` element of your document (or any parent element of your editor).

```html
<html dir="rtl">
    <!-- rest of your app -->
</html>
```
