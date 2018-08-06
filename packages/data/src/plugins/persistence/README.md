Persistence Plugin
==================

The persistence plugin enhances a registry to enable registered stores to opt in to persistent storage.

By default, persistence occurs by [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). This can be changed using the [`setStorage` function](#api) defined on the plugin. Unless set otherwise, state will be persisted on the `WP_DATA` key in storage.

## Usage

Call the `use` method on the default or your own registry to include the persistence plugin:

```js
wp.data.use( wp.data.plugins.persistence, { storageKey: 'example' } );
```

Then, when registering a store, set a `persist` property as `true` (persist all state) or an array of state keys to persist.

```js
wp.data.registerStore( 'my-plugin', {
	// ...

	persist: [ 'preferences' ],
} );
```

## Options

### `storage`

Persistent storage implementation. This must at least implement `getItem` and `setItem` of the Web Storage API.

See: https://developer.mozilla.org/en-US/docs/Web/API/Storage

### `storageKey`

The key on which to set in persistent storage.
