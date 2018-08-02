Data Plugins
============

Included here are a set of default plugin integrations for the WordPress data module.

## Usage

For any of the plugins included here as directories, call the `use` method on the default or your own registry with the plugin as a string to include its behaviors in the registry.

```js
wp.data.use( wp.data.plugins.persistence );
```
