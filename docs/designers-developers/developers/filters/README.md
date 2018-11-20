# Filter Reference

[Hooks](https://developer.wordpress.org/plugins/hooks/) are a way for one piece of code to interact/modify another piece of code. They provide one way for plugins and themes interact with Gutenberg, but they’re also used extensively by WordPress Core itself.

There are two types of hooks: [Actions](https://developer.wordpress.org/plugins/hooks/actions/) and [Filters](https://developer.wordpress.org/plugins/hooks/filters/). In addition to PHP actions and filters, Gutenberg also provides a mechanism for registering and executing hooks in JavaScript. This functionality is also available on npm as the [@wordpress/hooks](https://www.npmjs.com/package/@wordpress/hooks) package, for general purpose use.

You can also learn more about both APIs: [PHP](https://codex.wordpress.org/Plugin_API/) and [JavaScript](https://github.com/WordPress/packages/tree/master/packages/hooks).
