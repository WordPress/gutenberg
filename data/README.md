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

### `wp.data.registerActions( reducerKey: string, newActions: object )`

If your module or plugin needs to expose its actions to other modules and plugins, you'll have to register action creators.

An action creator is a function that takes arguments and returns an action object dispatch to the registered reducer to update the state.

#### Example:

```js
wp.data.registerActions( 'myPlugin', {
	setTitle( newTitle ) {
		return {
			type: 'SET_TITLE',
			title: newTitle,
		};
	},
} );
```

### `wp.data.select( key: string )`

This function allows calling any registered selector. Given a module's key, this function returns an object of all selector functions registered for the module.

#### Example:

```js
wp.data.select( 'myPlugin' ).getTitle(); // Returns "My post title"
```

### `wp.data.dispatch( key: string )`

This function allows calling any registered action. Given a module's key, this function returns an object of all action creators functions registered for the module.

#### Example:

```js
wp.data.dispatch( 'myPlugin' ).setTitle( 'new Title' ); // Dispatches the setTitle action to the reducer
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

### `wp.data.withSelect( mapStateToProps: Object|Function )( WrappedComponent: Component )`

To inject state-derived props into a WordPress Element Component, use the `withSelect` higher-order component:

```jsx
const Component = ( { title } ) => <div>{ title }</div>;

const EnhancedComponent = wp.data.withSelect( ( select ) => {
	return {
		title: select( 'myPlugin' ).getTitle,		
	};
} )( Component );
```

### `wp.data.withDispatch( propsToDispatchers: Object )( WrappedComponent: Component )`

To manipulate store data, you can pass dispatching actions into your component as props using the `withDispatch` higher-order component:

```jsx
const Component = ( { title, updateTitle } ) => <input value={ title } onChange={ updateTitle } />;

const EnhancedComponent = wp.element.compose( [
	wp.data.withSelect( ( select ) => {
		return {
			title: select( 'myPlugin' ).getTitle(),
		};
	} ),
	wp.data.withDispatch( ( dispatch ) => {
		return {
			updateTitle: dispatch( 'myPlugin' ).setTitle,			
		};
	} ),
] )( Component );
```
