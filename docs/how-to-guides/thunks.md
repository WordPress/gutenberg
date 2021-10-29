# Thunks in Core-Data

[Gutenberg 11.6](https://github.com/WordPress/gutenberg/pull/27276) added support for _thunks_. You can think of thunks as functions that can be dispatched:

```js
// actions.js
export const myThunkAction = () => ( { select, dispatch } ) => {
	return "I'm a thunk! I can be dispatched, use selectors, and even dispatch other actions.";
};
```

## Why are thunks useful?

Thunks [expand the meaning of what a Redux action is](https://jsnajdr.wordpress.com/2021/10/04/motivation-for-thunks/). Before thunks, actions were purely functional and could only return and yield data. Common use cases such as interacting with the store or requesting API data from an action required using a separate [control](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#controls). You would often see code like:

```js
export function* saveRecordAction( id ) {
	const record = yield controls.select( 'current-store', 'getRecord', id );
	yield { type: 'BEFORE_SAVE', id, record };
	const results = yield controls.fetch({ url: 'https://...', method: 'POST', data: record });
	yield { type: 'AFTER_SAVE', id, results };
	return results;
}

const controls = {
	select: // ...,
	fetch: // ...,
};
```

Side effects like store operations and fetch functions would be implemented outside of the action. Thunks provide an alternative to this approach. They allow you to use side effects inline, like this:

```js
export const saveRecordAction = ( id ) => async ({ select, dispatch }) => {
	const record = select( 'current-store', 'getRecord', id );
	dispatch({ type: 'BEFORE_SAVE', id, record });
	const response = await fetch({ url: 'https://...', method: 'POST', data: record });
	const results = await response.json();
	dispatch({ type: 'AFTER_SAVE', id, results });
	return results;
}
```

This removes the need to implement separate controls.

### Thunks have access to the store helpers

Let's take a look at an example from Gutenberg core. Prior to thunks, the `toggleFeature` action from the `@wordpress/interface` package was implemented like this:

```js
export function* toggleFeature( scope, featureName ) {
	const currentValue = yield controls.select(
		interfaceStoreName,
		'isFeatureActive',
		scope,
		featureName
	);

	yield controls.dispatch(
		interfaceStoreName,
		'setFeatureValue',
		scope,
		featureName,
		! currentValue
	);
}
```

Controls were the only way to `dispatch` actions and `select` data from the store.

With thunks, there is a cleaner way. This is how `toggleFeature` is implemented now:

```js
export function toggleFeature( scope, featureName ) {
	return function ( { select, dispatch } ) {
		const currentValue = select.isFeatureActive( scope, featureName );
		dispatch.setFeatureValue( scope, featureName, ! currentValue );
	};
}
```

Thanks to the `select` and `dispatch` arguments, thunks may use the store directly without the need for generators and controls.

### Thunks can be async

Imagine a simple React app that allows you to set the temperature on a thermostat. It only has one input and one button. Clicking the button dispatches a `saveTemperatureToAPI` action with the value from the input.

If we used controls to save the temperature, the store definition would look like below:

```js
const store = wp.data.createReduxStore( 'my-store', {
    actions: {
        saveTemperatureToAPI: function*( temperature ) {
            const result = yield { type: 'FETCH_JSON', url: 'https://...', method: 'POST', data: { temperature } };
            return result;
        }
    },
    controls: {
        async FETCH_JSON( action ) {
            const response = await window.fetch( action.url, {
                method: action.method,
                body: JSON.stringify( action.data ),
            } );
            return response.json();
        }
    },
    // reducers, selectors, ...
} );
```

While the code is reasonably straightforward, there is a level of indirection. The `saveTemperatureToAPI` action does not talk directly to the API, but has to go through the `FETCH_JSON` control.

Let's see how this indirection can be removed with thunks:

```js
const store = wp.data.createReduxStore( 'my-store', {
    __experimentalUseThunks: true,
    actions: {
        saveTemperatureToAPI: ( temperature ) => async () => {
            const response = await window.fetch( 'https://...', {
                method: 'POST',
                body: JSON.stringify( { temperature } ),
            } );
            return await response.json();
        }
    },
    // reducers, selectors, ...
} );
```

That's pretty cool! What's even better is that resolvers are supported as well:

```js
const store = wp.data.createReduxStore( 'my-store', {
    // ...
    selectors: {
        getTemperature: ( state ) => state.temperature
    },
    resolvers: {
        getTemperature: () => async ( { dispatch } ) => {
            const response = await window.fetch( 'https://...' );
            const result = await response.json();
            dispatch.receiveCurrentTemperature( result.temperature );
        }
    },
    // ...
} );
```

Support for thunks is experimental for now. You can enable it by setting `__experimentalUseThunks: true` when registering your store.

## Thunks API

A thunk receives a single object argument with the following keys:

### select

An object containing the store’s selectors pre-bound to state, which means you don't need to provide the state, only the additional arguments. `select` triggers the related resolvers, if any, but does not wait for them to finish. It just returns the current value even if it's null.


If a selector is part of the public API, it's available as a method on the select object:

```js
const thunk = () => ( { select } ) => {
    // select is an object of the store’s selectors, pre-bound to current state:
    const temperature = select.getTemperature();
}
```

Since not all selectors are exposed on the store, `select` doubles as a function that supports passing a selector as an argument:

```js
const thunk = () => ( { select } ) => {
    // select supports private selectors:
    const doubleTemperature = select( ( temperature ) => temperature * 2 );
}
```

### resolveSelect

`resolveSelect` is the same as `select`, except it returns a promise that resolves with the value provided by the related resolver.

```js
const thunk = () => ( { resolveSelect } ) => {
    const temperature = await resolveSelect.getTemperature();
}
```

### dispatch

An object containing the store’s actions

If an action is part of the public API, it's available as a method on the `dispatch` object:

```js
const thunk = () => ( { dispatch } ) => {
    // dispatch is an object of the store’s actions:
    const temperature = await dispatch.retrieveTemperature();
}
```

Since not all actions are exposed on the store, `dispatch` doubles as a function that supports passing a Redux action as an argument:

```js
const thunk = () => async ( { dispatch } ) => {
	// dispatch is also a function accepting inline actions:
	dispatch({ type: 'SET_TEMPERATURE', temperature: result.value });

	// thunks are interchangeable with actions
	dispatch( updateTemperature( 100 ) );

	// Thunks may be async, too. When they are, dispatch returns a promise
	await dispatch( ( ) => window.fetch( /* ... */ ) );
}
```

### registry

A registry provides access to other stores through its `dispatch`, `select`, and `resolveSelect` methods.
These are very similar to the ones described above, with a slight twist. Calling `registry.select( storeName )` returns a function returning an object of selectors from `storeName`. This comes handy when you need to interact with another store. For example:

```js
const thunk = () => ( { registry } ) => {
  const error = registry.select( 'core' ).getLastEntitySaveError( 'root', 'menu', menuId );
  /* ... */
}
```

