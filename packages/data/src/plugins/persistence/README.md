Persistence Plugin
==================

The persistence plugin enhances a registry to enable registered stores to opt in to persistent storage.

By default, persistence occurs by [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). This can be changed using the [`setStorage` function](#api) defined on the plugin. Unless set otherwise, state will be persisted on the `WP_DATA` key in storage.

## Usage

Call the `use` method on the default or your own registry to include the persistence plugin:

```js
wp.data.use( 'persistence' );
```

Then, when registering a store, set a `persist` property as `true` (persist all state) or an array of state keys to persist.

```js
wp.data.registerStore( 'my-plugin', {
	// ...

	persist: [ 'preferences' ],
} );
```

## API

### `setStorage`

Assign the persistent storage implementation. At minimum, this should implement `getItem` and `setItem` of the Web Storage API.

See: https://developer.mozilla.org/en-US/docs/Web/API/Storage

### `getStorage`

Returns the persistence storage handler.

### `setStorageKey`

Assigns the key on which to set in the persistent storage.

### `getStorageKey`

Returns the key on which to set in the persistent storage.
