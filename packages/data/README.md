# Data

WordPress' data module serves as a hub to manage application state for both plugins and WordPress itself, providing tools to manage data within and between distinct modules. It is designed as a modular pattern for organizing and sharing data: simple enough to satisfy the needs of a small plugin, while scalable to serve the requirements of a complex single-page application.

The data module is built upon and shares many of the same core principles of [Redux](https://redux.js.org/), but shouldn't be mistaken as merely _Redux for WordPress_, as it includes a few of its own [distinguishing characteristics](#comparison-with-redux). As you read through this guide, you may find it useful to reference the Redux documentation — particularly [its glossary](https://redux.js.org/glossary) — for more detail on core concepts.

## Installation

Install the module

```bash
npm install @wordpress/data --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Registering a Store

Use the `register` function to add your own store to the centralized data registry. This function accepts one argument – a store descriptor that can be created with `createReduxStore` factory function. `createReduxStore` accepts two arguments: a name to identify the module, and a configuration object with values describing how your state is represented, modified, and accessed. At a minimum, you must provide a reducer function describing the shape of your state and how it changes in response to actions dispatched to the store.

```js
import apiFetch from '@wordpress/api-fetch';
import { createReduxStore, register } from '@wordpress/data';

const DEFAULT_STATE = {
	prices: {},
	discountPercent: 0,
};

const actions = {
	setPrice( item, price ) {
		return {
			type: 'SET_PRICE',
			item,
			price,
		};
	},

	startSale( discountPercent ) {
		return {
			type: 'START_SALE',
			discountPercent,
		};
	},

	fetchFromAPI( path ) {
		return {
			type: 'FETCH_FROM_API',
			path,
		};
	},
};

const store = createReduxStore( 'my-shop', {
	reducer( state = DEFAULT_STATE, action ) {
		switch ( action.type ) {
			case 'SET_PRICE':
				return {
					...state,
					prices: {
						...state.prices,
						[ action.item ]: action.price,
					},
				};

			case 'START_SALE':
				return {
					...state,
					discountPercent: action.discountPercent,
				};
		}

		return state;
	},

	actions,

	selectors: {
		getPrice( state, item ) {
			const { prices, discountPercent } = state;
			const price = prices[ item ];

			return price * ( 1 - 0.01 * discountPercent );
		},
	},

	controls: {
		FETCH_FROM_API( action ) {
			return apiFetch( { path: action.path } );
		},
	},

	resolvers: {
		*getPrice( item ) {
			const path = '/wp/v2/prices/' + item;
			const price = yield actions.fetchFromAPI( path );
			return actions.setPrice( item, price );
		},
	},
} );

register( store );
```

The return value of `createReduxStore` is the `StoreDescriptor` object that contains two properties:

-   `name` (`string`) – the name of the store
-   `instantiate` (`Function`) - it returns a [Redux-like store object](https://redux.js.org/basics/store) with the following methods:
    -   `getState()`: Returns the state value of the registered reducer
        -   _Redux parallel:_ [`getState`](https://redux.js.org/api/store#getstate)
    -   `subscribe( listener: Function )`: Registers a function called any time the value of state changes.
        -   _Redux parallel:_ [`subscribe`](https://redux.js.org/api/store#subscribelistener)
    -   `dispatch( action: Object )`: Given an action object, calls the registered reducer and updates the state value.
        -   _Redux parallel:_ [`dispatch`](https://redux.js.org/api/store#dispatchaction)

### Redux Store Options

#### `reducer`

A [**reducer**](https://redux.js.org/basics/reducers) is a function accepting the previous `state` and `action` as arguments and returns an updated `state` value.

#### `actions`

The **`actions`** object should describe all [action creators](https://redux.js.org/glossary#action-creator) available for your store. An action creator is a function that optionally accepts arguments and returns an action object to dispatch to the registered reducer. _Dispatching actions is the primary mechanism for making changes to your state._

#### `selectors`

The **`selectors`** object includes a set of functions for accessing and deriving state values. A selector is a function which accepts state and optional arguments and returns some value from state. _Calling selectors is the primary mechanism for retrieving data from your state_, and serve as a useful abstraction over the raw data which is typically more susceptible to change and less readily usable as a [normalized object](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape#designing-a-normalized-state).

#### `resolvers`

A **resolver** is a side-effect for a selector. If your selector result may need to be fulfilled from an external source, you can define a resolver such that the first time the selector is called, the fulfillment behavior is effected.

The `resolvers` option should be passed as an object where each key is the name of the selector to act upon, the value a function which receives the same arguments passed to the selector, excluding the state argument. It can then dispatch as necessary to fulfill the requirements of the selector, taking advantage of the fact that most data consumers will subscribe to subsequent state changes (by `subscribe` or `withSelect`).

#### `controls`

A **control** defines the execution flow behavior associated with a specific action type. This can be particularly useful in implementing asynchronous data flows for your store. By defining your action creator or resolvers as a generator which yields specific controlled action types, the execution will proceed as defined by the control handler.

The `controls` option should be passed as an object where each key is the name of the action type to act upon, the value a function which receives the original action object. It should returns either a promise which is to resolve when evaluation of the action should continue, or a value. The value or resolved promise value is assigned on the return value of the yield assignment. If the control handler returns undefined, the execution is not continued.

Refer to the [documentation of `@wordpress/redux-routine`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/redux-routine/README.md) for more information.

#### `initialState`

An optional preloaded initial state for the store. You may use this to restore some serialized state value or a state generated server-side.

## Generic Stores

The `@wordpress/data` module offers a more advanced and generic interface for the purposes of integrating other data systems and situations where more direct control over a data system is needed. In this case, a data store will need to be implemented outside of `@wordpress/data` and then plugged in via three functions:

-   `getSelectors()`: Returns an object of selector functions, pre-mapped to the store.
-   `getActions()`: Returns an object of action functions, pre-mapped to the store.
-   `subscribe( listener: Function )`: Registers a function called any time the value of state changes.
    -   Behaves as Redux [`subscribe`](https://redux.js.org/api/store#subscribelistener)
        with the following differences:
        -   Doesn't have to implement an unsubscribe, since the registry never uses it.
            \- Only has to support one listener (the registry).

By implementing the above interface for your custom store, you gain the benefits of using the registry and the `withSelect` and `withDispatch` higher order components in your application code. This provides seamless integration with existing and alternative data systems.

Integrating an existing redux store with its own reducers, store enhancers and middleware can be accomplished as follows:

_Example:_

```js
import { mapValues } from 'lodash';
import { register } from '@wordpress/data';
import existingSelectors from './existing-app/selectors';
import existingActions from './existing-app/actions';
import createStore from './existing-app/store';

const reduxStore = createStore();

const boundSelectors = mapValues(
	existingSelectors,
	( selector ) => ( ...args ) => selector( reduxStore.getState(), ...args )
);

const boundActions = mapValues( existingActions, ( action ) => ( ...args ) =>
	reduxStore.dispatch( action( ...args ) )
);

const genericStore = {
	name: 'existing-app',
	instantiate: () => ( {
		getSelectors: () => boundSelectors,
		getActions: () => boundActions,
		subscribe: reduxStore.subscribe,
	} ),
};

register( genericStore );
```

It is also possible to implement a completely custom store from scratch:

_Example:_

```js
import { register } from '@wordpress/data';

function customStore() {
	return {
		name: 'custom-data',
		instantiate: () => {
			const listeners = new Set();
			const prices = { hammer: 7.5 };

			function storeChanged() {
				for ( const listener of listeners ) {
					listener();
				}
			}

			function subscribe( listener ) {
				listeners.add( listener );
				return () => listeners.delete( listener );
			}

			const selectors = {
				getPrice( itemName ) {
					return prices[ itemName ];
				},
			};

			const actions = {
				setPrice( itemName, price ) {
					prices[ itemName ] = price;
					storeChanged();
				},
			};

			return {
				getSelectors: () => selectors,
				getActions: () => actions,
				subscribe,
			};
		},
	};
}

register( customStore );
```

## Comparison with Redux

The data module shares many of the same [core principles](https://redux.js.org/introduction/three-principles) and [API method naming](https://redux.js.org/api/api-reference) of [Redux](https://redux.js.org/). In fact, it is implemented atop Redux. Where it differs is in establishing a modularization pattern for creating separate but interdependent stores, and in codifying conventions such as selector functions as the primary entry point for data access.

The [higher-order components](#higher-order-components) were created to complement this distinction. The intention with splitting `withSelect` and `withDispatch` — where in React Redux they are combined under `connect` as `mapStateToProps` and `mapDispatchToProps` arguments — is to more accurately reflect that dispatch is not dependent upon a subscription to state changes, and to allow for state-derived values to be used in `withDispatch` (via [higher-order component composition](https://github.com/WordPress/gutenberg/tree/HEAD/packages/compose/README.md)).

The data module also has built-in solutions for handling asynchronous side-effects, through [resolvers](#resolvers) and [controls](#controls). These differ slightly from [standard redux async solutions](https://redux.js.org/advanced/async-actions) like [`redux-thunk`](https://github.com/gaearon/redux-thunk) or [`redux-saga`](https://redux-saga.js.org/).

Specific implementation differences from Redux and React Redux:

-   In Redux, a `subscribe` listener is called on every dispatch, regardless of whether the value of state has changed.
    -   In `@wordpress/data`, a subscriber is only called when state has changed.
-   In React Redux, a `mapStateToProps` function must return an object.
    -   In `@wordpress/data`, a `withSelect` mapping function can return `undefined` if it has no props to inject.
-   In React Redux, the `mapDispatchToProps` argument can be defined as an object or a function.
    -   In `@wordpress/data`, the `withDispatch` higher-order component creator must be passed a function.

## API

<!-- START TOKEN(Autogenerated API docs) -->

### AsyncModeProvider

Context Provider Component used to switch the data module component rerendering
between Sync and Async modes.

_Usage_

```js
import { useSelect, AsyncModeProvider } from '@wordpress/data';

function BlockCount() {
	const count = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getBlockCount();
	}, [] );

	return count;
}

function App() {
	return (
		<AsyncModeProvider value={ true }>
			<BlockCount />
		</AsyncModeProvider>
	);
}
```

In this example, the BlockCount component is rerendered asynchronously.
It means if a more critical task is being performed (like typing in an input),
the rerendering is delayed until the browser becomes IDLE.
It is possible to nest multiple levels of AsyncModeProvider to fine-tune the rendering behavior.

_Parameters_

-   _props.value_ `boolean`: Enable Async Mode.

_Returns_

-   `WPComponent`: The component to be rendered.

### combineReducers

The combineReducers helper function turns an object whose values are different
reducing functions into a single reducing function you can pass to registerReducer.

_Usage_

```js
import { combineReducers, createReduxStore, register } from '@wordpress/data';

const prices = ( state = {}, action ) => {
	return action.type === 'SET_PRICE'
		? {
				...state,
				[ action.item ]: action.price,
		  }
		: state;
};

const discountPercent = ( state = 0, action ) => {
	return action.type === 'START_SALE' ? action.discountPercent : state;
};

const store = createReduxStore( 'my-shop', {
	reducer: combineReducers( {
		prices,
		discountPercent,
	} ),
} );
register( store );
```

_Parameters_

-   _reducers_ `Object`: An object whose values correspond to different reducing functions that need to be combined into one.

_Returns_

-   `Function`: A reducer that invokes every reducer inside the reducers object, and constructs a state object with the same shape.

### controls

Undocumented declaration.

### createReduxStore

Creates a data store descriptor for the provided Redux store configuration containing
properties describing reducer, actions, selectors, controls and resolvers.

_Usage_

```js
import { createReduxStore } from '@wordpress/data';

const store = createReduxStore( 'demo', {
	reducer: ( state = 'OK' ) => state,
	selectors: {
		getValue: ( state ) => state,
	},
} );
```

_Parameters_

-   _key_ `string`: Unique namespace identifier.
-   _options_ `ReduxStoreConfig`: Registered store options, with properties describing reducer, actions, selectors, and resolvers.

_Returns_

-   `StoreDescriptor`: Store Object.

### createRegistry

Creates a new store registry, given an optional object of initial store
configurations.

_Parameters_

-   _storeConfigs_ `Object`: Initial store configurations.
-   _parent_ `Object?`: Parent registry.

_Returns_

-   `WPDataRegistry`: Data registry.

### createRegistryControl

Creates a control function that takes additional curried argument with the `registry` object.
While a regular control has signature

```js
( action ) => iteratorOrPromise;
```

where the control works with the `action` that it's bound to, a registry control has signature:

```js
( registry ) => ( action ) => iteratorOrPromise;
```

A registry control is typically used to select data or dispatch an action to a registered
store.

When registering a control created with `createRegistryControl` with a store, the store
knows which calling convention to use when executing the control.

_Parameters_

-   _registryControl_ `Function`: Function receiving a registry object and returning a control.

_Returns_

-   `Function`: Registry control that can be registered with a store.

### createRegistrySelector

Creates a selector function that takes additional curried argument with the
registry `select` function. While a regular selector has signature

```js
( state, ...selectorArgs ) => result;
```

that allows to select data from the store's `state`, a registry selector
has signature:

```js
( select ) => ( state, ...selectorArgs ) => result;
```

that supports also selecting from other registered stores.

_Usage_

```js
const getCurrentPostId = createRegistrySelector( ( select ) => ( state ) => {
	return select( 'core/editor' ).getCurrentPostId();
} );

const getPostEdits = createRegistrySelector( ( select ) => ( state ) => {
	// calling another registry selector just like any other function
	const postType = getCurrentPostType( state );
	const postId = getCurrentPostId( state );
	return select( 'core' ).getEntityRecordEdits(
		'postType',
		postType,
		postId
	);
} );
```

Note how the `getCurrentPostId` selector can be called just like any other function,
(it works even inside a regular non-registry selector) and we don't need to pass the
registry as argument. The registry binding happens automatically when registering the selector
with a store.

_Parameters_

-   _registrySelector_ `Function`: Function receiving a registry `select` function and returning a state selector.

_Returns_

-   `Function`: Registry selector that can be registered with a store.

### dispatch

Given the name of a registered store, returns an object of the store's action creators.
Calling an action creator will cause it to be dispatched, updating the state value accordingly.

Note: Action creators returned by the dispatch will return a promise when
they are called.

_Usage_

```js
import { dispatch } from '@wordpress/data';

dispatch( 'my-shop' ).setPrice( 'hammer', 9.75 );
```

_Parameters_

-   _storeNameOrDescriptor_ `string|StoreDescriptor`: Unique namespace identifier for the store or the store descriptor.

_Returns_

-   `Object`: Object containing the action creators.

### plugins

Object of available plugins to use with a registry.

_Related_

-   [use](#use)

_Type_

-   `Object`

### register

Registers a standard `@wordpress/data` store descriptor.

_Usage_

```js
import { createReduxStore, register } from '@wordpress/data';

const store = createReduxStore( 'demo', {
	reducer: ( state = 'OK' ) => state,
	selectors: {
		getValue: ( state ) => state,
	},
} );
register( store );
```

_Parameters_

-   _store_ `StoreDescriptor`: Store descriptor.

### registerGenericStore

> **Deprecated** Use `register( storeDescriptor )` instead.

Registers a generic store instance.

_Parameters_

-   _name_ `string`: Store registry name.
-   _store_ `Object`: Store instance (`{ getSelectors, getActions, subscribe }`).

### registerStore

> **Deprecated** Use `register` instead.

Registers a standard `@wordpress/data` store.

_Parameters_

-   _storeName_ `string`: Unique namespace identifier for the store.
-   _options_ `Object`: Store description (reducer, actions, selectors, resolvers).

_Returns_

-   `Object`: Registered store object.

### RegistryConsumer

A custom react Context consumer exposing the provided `registry` to
children components. Used along with the RegistryProvider.

You can read more about the react context api here:
<https://reactjs.org/docs/context.html#contextprovider>

_Usage_

```js
import {
  RegistryProvider,
  RegistryConsumer,
  createRegistry
} from '@wordpress/data';

const registry = createRegistry( {} );

const App = ( { props } ) => {
  return <RegistryProvider value={ registry }>
    <div>Hello There</div>
    <RegistryConsumer>
      { ( registry ) => (
        <ComponentUsingRegistry
        		{ ...props }
        	  registry={ registry }
      ) }
    </RegistryConsumer>
  </RegistryProvider>
}
```

### RegistryProvider

A custom Context provider for exposing the provided `registry` to children
components via a consumer.

See <a name="#RegistryConsumer">RegistryConsumer</a> documentation for
example.

### resolveSelect

Given the name of a registered store, returns an object containing the store's
selectors pre-bound to state so that you only need to supply additional arguments,
and modified so that they return promises that resolve to their eventual values,
after any resolvers have ran.

_Usage_

```js
import { resolveSelect } from '@wordpress/data';

resolveSelect( 'my-shop' ).getPrice( 'hammer' ).then( console.log );
```

_Parameters_

-   _storeNameOrDescriptor_ `string|StoreDescriptor`: Unique namespace identifier for the store or the store descriptor.

_Returns_

-   `Object`: Object containing the store's promise-wrapped selectors.

### select

Given the name or descriptor of a registered store, returns an object of the store's selectors.
The selector functions are been pre-bound to pass the current state automatically.
As a consumer, you need only pass arguments of the selector, if applicable.

_Usage_

```js
import { select } from '@wordpress/data';

select( 'my-shop' ).getPrice( 'hammer' );
```

_Parameters_

-   _storeNameOrDescriptor_ `string|StoreDescriptor`: Unique namespace identifier for the store or the store descriptor.

_Returns_

-   `Object`: Object containing the store's selectors.

### subscribe

Given a listener function, the function will be called any time the state value
of one of the registered stores has changed. This function returns a `unsubscribe`
function used to stop the subscription.

_Usage_

```js
import { subscribe } from '@wordpress/data';

const unsubscribe = subscribe( () => {
	// You could use this opportunity to test whether the derived result of a
	// selector has subsequently changed as the result of a state update.
} );

// Later, if necessary...
unsubscribe();
```

_Parameters_

-   _listener_ `Function`: Callback function.

### use

Extends a registry to inherit functionality provided by a given plugin. A
plugin is an object with properties aligning to that of a registry, merged
to extend the default registry behavior.

_Parameters_

-   _plugin_ `Object`: Plugin object.

### useDispatch

A custom react hook returning the current registry dispatch actions creators.

Note: The component using this hook must be within the context of a
RegistryProvider.

_Usage_

This illustrates a pattern where you may need to retrieve dynamic data from
the server via the `useSelect` hook to use in combination with the dispatch
action.

```jsx
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

function Button( { onClick, children } ) {
	return (
		<button type="button" onClick={ onClick }>
			{ children }
		</button>
	);
}

const SaleButton = ( { children } ) => {
	const { stockNumber } = useSelect(
		( select ) => select( 'my-shop' ).getStockNumber(),
		[]
	);
	const { startSale } = useDispatch( 'my-shop' );
	const onClick = useCallback( () => {
		const discountPercent = stockNumber > 50 ? 10 : 20;
		startSale( discountPercent );
	}, [ stockNumber ] );
	return <Button onClick={ onClick }>{ children }</Button>;
};

// Rendered somewhere in the application:
//
// <SaleButton>Start Sale!</SaleButton>
```

_Parameters_

-   _storeNameOrDescriptor_ `[string|StoreDescriptor]`: Optionally provide the name of the store or its descriptor from which to retrieve action creators. If not provided, the registry.dispatch function is returned instead.

_Returns_

-   `Function`: A custom react hook.

### useRegistry

A custom react hook exposing the registry context for use.

This exposes the `registry` value provided via the
<a href="#RegistryProvider">Registry Provider</a> to a component implementing
this hook.

It acts similarly to the `useContext` react hook.

Note: Generally speaking, `useRegistry` is a low level hook that in most cases
won't be needed for implementation. Most interactions with the `@wordpress/data`
API can be performed via the `useSelect` hook, or the `withSelect` and
`withDispatch` higher order components.

_Usage_

```js
import { RegistryProvider, createRegistry, useRegistry } from '@wordpress/data';

const registry = createRegistry( {} );

const SomeChildUsingRegistry = ( props ) => {
	const registry = useRegistry();
	// ...logic implementing the registry in other react hooks.
};

const ParentProvidingRegistry = ( props ) => {
	return (
		<RegistryProvider value={ registry }>
			<SomeChildUsingRegistry { ...props } />
		</RegistryProvider>
	);
};
```

_Returns_

-   `Function`: A custom react hook exposing the registry context value.

### useSelect

Custom react hook for retrieving props from registered selectors.

In general, this custom React hook follows the
[rules of hooks](https://reactjs.org/docs/hooks-rules.html).

_Usage_

```js
import { useSelect } from '@wordpress/data';

function HammerPriceDisplay( { currency } ) {
	const price = useSelect(
		( select ) => {
			return select( 'my-shop' ).getPrice( 'hammer', currency );
		},
		[ currency ]
	);
	return new Intl.NumberFormat( 'en-US', {
		style: 'currency',
		currency,
	} ).format( price );
}

// Rendered in the application:
// <HammerPriceDisplay currency="USD" />
```

In the above example, when `HammerPriceDisplay` is rendered into an
application, the price will be retrieved from the store state using the
`mapSelect` callback on `useSelect`. If the currency prop changes then
any price in the state for that currency is retrieved. If the currency prop
doesn't change and other props are passed in that do change, the price will
not change because the dependency is just the currency.

When data is only used in an event callback, the data should not be retrieved
on render, so it may be useful to get the selectors function instead.

**Don't use `useSelect` this way when calling the selectors in the render
function because your component won't re-render on a data change.**

```js
import { useSelect } from '@wordpress/data';

function Paste( { children } ) {
	const { getSettings } = useSelect( 'my-shop' );
	function onPaste() {
		// Do something with the settings.
		const settings = getSettings();
	}
	return <div onPaste={ onPaste }>{ children }</div>;
}
```

_Parameters_

-   _mapSelect_ `Function|StoreDescriptor|string`: Function called on every state change. The returned value is exposed to the component implementing this hook. The function receives the `registry.select` method on the first argument and the `registry` on the second argument. When a store key is passed, all selectors for the store will be returned. This is only meant for usage of these selectors in event callbacks, not for data needed to create the element tree.
-   _deps_ `Array`: If provided, this memoizes the mapSelect so the same `mapSelect` is invoked on every state change unless the dependencies change.

_Returns_

-   `Function`: A custom react hook.

### withDispatch

Higher-order component used to add dispatch props using registered action
creators.

_Usage_

```jsx
function Button( { onClick, children } ) {
	return (
		<button type="button" onClick={ onClick }>
			{ children }
		</button>
	);
}

import { withDispatch } from '@wordpress/data';

const SaleButton = withDispatch( ( dispatch, ownProps ) => {
	const { startSale } = dispatch( 'my-shop' );
	const { discountPercent } = ownProps;

	return {
		onClick() {
			startSale( discountPercent );
		},
	};
} )( Button );

// Rendered in the application:
//
// <SaleButton discountPercent="20">Start Sale!</SaleButton>
```

In the majority of cases, it will be sufficient to use only two first params
passed to `mapDispatchToProps` as illustrated in the previous example.
However, there might be some very advanced use cases where using the
`registry` object might be used as a tool to optimize the performance of
your component. Using `select` function from the registry might be useful
when you need to fetch some dynamic data from the store at the time when the
event is fired, but at the same time, you never use it to render your
component. In such scenario, you can avoid using the `withSelect` higher
order component to compute such prop, which might lead to unnecessary
re-renders of your component caused by its frequent value change.
Keep in mind, that `mapDispatchToProps` must return an object with functions
only.

```jsx
function Button( { onClick, children } ) {
	return (
		<button type="button" onClick={ onClick }>
			{ children }
		</button>
	);
}

import { withDispatch } from '@wordpress/data';

const SaleButton = withDispatch( ( dispatch, ownProps, { select } ) => {
	// Stock number changes frequently.
	const { getStockNumber } = select( 'my-shop' );
	const { startSale } = dispatch( 'my-shop' );
	return {
		onClick() {
			const discountPercent = getStockNumber() > 50 ? 10 : 20;
			startSale( discountPercent );
		},
	};
} )( Button );

// Rendered in the application:
//
//  <SaleButton>Start Sale!</SaleButton>
```

_Note:_ It is important that the `mapDispatchToProps` function always
returns an object with the same keys. For example, it should not contain
conditions under which a different value would be returned.

_Parameters_

-   _mapDispatchToProps_ `Function`: A function of returning an object of prop names where value is a dispatch-bound action creator, or a function to be called with the component's props and returning an action creator.

_Returns_

-   `WPComponent`: Enhanced component with merged dispatcher props.

### withRegistry

Higher-order component which renders the original component with the current
registry context passed as its `registry` prop.

_Parameters_

-   _OriginalComponent_ `WPComponent`: Original component.

_Returns_

-   `WPComponent`: Enhanced component.

### withSelect

Higher-order component used to inject state-derived props using registered
selectors.

_Usage_

```js
import { withSelect } from '@wordpress/data';

function PriceDisplay( { price, currency } ) {
	return new Intl.NumberFormat( 'en-US', {
		style: 'currency',
		currency,
	} ).format( price );
}

const HammerPriceDisplay = withSelect( ( select, ownProps ) => {
	const { getPrice } = select( 'my-shop' );
	const { currency } = ownProps;

	return {
		price: getPrice( 'hammer', currency ),
	};
} )( PriceDisplay );

// Rendered in the application:
//
//  <HammerPriceDisplay currency="USD" />
```

In the above example, when `HammerPriceDisplay` is rendered into an
application, it will pass the price into the underlying `PriceDisplay`
component and update automatically if the price of a hammer ever changes in
the store.

_Parameters_

-   _mapSelectToProps_ `Function`: Function called on every state change, expected to return object of props to merge with the component's own props.

_Returns_

-   `WPComponent`: Enhanced component with merged state data props.

<!-- END TOKEN(Autogenerated API docs) -->

### batch

As a response of `dispatch` calls, WordPress data based applications updates the connected components (Components using `useSelect` or `withSelect`). This update happens in two steps:

-   The selectors are called with the update state.
-   If the selectors return values that are different than the previous (strict equality), the component rerenders.

As the application grows, this can become costful, so it's important to ensure that we avoid running both these if possible. One of these situations happen when an interaction requires multiple consisecutive `dispatch` calls in order to update the state properly. To avoid rerendering the components each time we call `dispatch`, we can wrap the sequential dispatch calls in `batch` which will ensure that the components only call selectors and rerender once at the end of the sequence.

_Usage_

```js
import { useRegistry } from '@wordpress/data';

function Component() {
	const registry = useRegistry();

	function callback() {
		// This will only rerender the components once.
		registry.batch( () => {
			registry.dispatch( someStore ).someAction();
			registry.dispatch( someStore ).someOtherAction();
		} );
	}

	return <button onClick={ callback }>Click me</button>;
}
```

## Going further

-   [What is WordPress Data?](https://unfoldingneurons.com/2020/what-is-wordpress-data/)

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
