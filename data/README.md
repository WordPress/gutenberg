Data
====

The more WordPress UI moves to the client, the more there's a need for a centralized data module allowing data management and sharing between several WordPress modules and plugins.

This module holds a global state variable and exposes a "Redux-like" API containing the following methods:


### `wp.data.registerReducer( key: string, reducer: function )`

If your module or plugin needs to store and manipulate client-side data, you'll have to register a "reducer" to do so. A reducer is a function taking the previous `state` and `action` and returns an update `state`. You can learn more about reducers on the [Redux Documentation](https://redux.js.org/docs/basics/Reducers.html)

This function takes two arguments: a `key` to identify the module (example: `myAwesomePlugin`) and the reducer function. It returns a [Redux-like store object](https://redux.js.org/docs/basics/Store.html) with the following methods:

#### `store.getState()`

Returns the [state object](https://redux.js.org/docs/Glossary.html#state) of the registered reducer. See: https://redux.js.org/docs/api/Store.html#getState

#### `store.subscribe( listener: function )`

Registers a [`listener`](https://redux.js.org/docs/api/Store.html#subscribe) function called everytime the state is updated.

#### `store.dispatch( action: object )`

The dispatch function should be called to trigger the registered reducers function and update the state. An [`action`](https://redux.js.org/docs/api/Store.html#dispatch) object should be passed to this function. This action is passed to the registered reducers in addition to the previous state.


### `wp.data.registerSelectors( reducerKey: string, newSelectors: object )`

If your module or plugin needs to expose its state to other modules and plugins, you'll have to register state selectors.

A selector is a function that takes the current state value as a first argument and extra arguments if needed and returns any data extracted from the state.

#### Example:

Let's say the state of our plugin (registered with the key `myPlugin`) has the following shape: `{ title: 'My post title' }`. We can register a `getTitle` selector to make this state value available like so:

```js
wp.data.registerSelectors( 'myPlugin', { getTitle: ( state ) => state.title } );
```

### `wp.data.select( key: string )`

This function allows calling any registered selector. Given a module's key, this function returns an object of all selector functions registered for the module.

#### Example:

```js
wp.data.select( 'myPlugin' ).getTitle(); // Returns "My post title"
```

### `wp.data.query( mapSelectorsToProps: function )( WrappedComponent: Component )`

If you use a React or WordPress Element, a Higher Order Component is made available to inject data into your components like so:

```js
const Component = ( { title } ) => <div>{ title }</div>;

wp.data.query( select => {
	return {
		title: select( 'myPlugin' ).getTitle(),
	};
} )( Component );
```

### `wp.data.subscribe( listener: function )`

Function used to subscribe to data changes. The listener function is called each time a change is made to any of the registered reducers. This function returns a `unsubscribe` function used to abort the subscription.

```js
// Subscribe.
const unsubscribe = wp.data.subscribe( () => {
	const data = {
		slug: wp.data.select( 'core/editor' ).getEditedPostSlug(),
	};

	console.log( 'data changed', data );
} );

// Unsubcribe.
unsubscribe();
```
