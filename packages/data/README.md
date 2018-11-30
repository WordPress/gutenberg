# Data

WordPress' data module serves as a hub to manage application state for both plugins and WordPress itself, providing tools to manage data within and between distinct modules. It is designed as a modular pattern for organizing and sharing data: simple enough to satisfy the needs of a small plugin, while scalable to serve the requirements of a complex single-page application.

The data module is built upon and shares many of the same core principles of [Redux](https://redux.js.org/), but shouldn't be mistaken as merely _Redux for WordPress_, as it includes a few of its own [distinguishing characteristics](#comparison-with-redux). As you read through this guide, you may find it useful to reference the Redux documentation — particularly [its glossary](https://redux.js.org/glossary) — for more detail on core concepts.

## Installation

Install the module

```bash
npm install @wordpress/data --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Registering a Store

Use the `registerStore` function to add your own store to the centralized data registry. This function accepts two arguments: a name to identify the module, and an object with values describing how your state is represented, modified, and accessed. At a minimum, you must provide a reducer function describing the shape of your state and how it changes in response to actions dispatched to the store.

```js
const { data, apiFetch } = wp;
const { registerStore } = data;

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

registerStore( 'my-shop', {
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

			return price * ( 1 - ( 0.01 * discountPercent ) );
		},
	},

	controls: {
		FETCH_FROM_API( action ) {
			return apiFetch( { path: action.path } );
		},
	},

	resolvers: {
		* getPrice( state, item ) {
			const path = '/wp/v2/prices/' + item;
			const price = yield actions.fetchFromAPI( path );
			return actions.setPrice( item, price );
		},
	},
} );
```

The return value of `registerStore` is a [Redux-like store object](https://redux.js.org/docs/basics/Store.html) with the following methods:

- `store.getState()`: Returns the state value of the registered reducer
   - _Redux parallel:_ [`getState`](https://redux.js.org/api-reference/store#getState)
- `store.subscribe( listener: Function )`: Registers a function called any time the value of state changes.
   - _Redux parallel:_ [`subscribe`](https://redux.js.org/api-reference/store#subscribe(listener))
- `store.dispatch( action: Object )`: Given an action object, calls the registered reducer and updates the state value.
   - _Redux parallel:_ [`dispatch`](https://redux.js.org/api-reference/store#dispatch(action))

## Options

### `reducer`

A [**reducer**](https://redux.js.org/docs/basics/Reducers.html) is a function accepting the previous `state` and `action` as arguments and returns an updated `state` value.

### `actions`

The **`actions`** object should describe all [action creators](https://redux.js.org/glossary#action-creator) available for your store. An action creator is a function that optionally accepts arguments and returns an action object to dispatch to the registered reducer. _Dispatching actions is the primary mechanism for making changes to your state._

### `selectors`

The **`selectors`** object includes a set of functions for accessing and deriving state values. A selector is a function which accepts state and optional arguments and returns some value from state. _Calling selectors is the primary mechanism for retrieving data from your state_, and serve as a useful abstraction over the raw data which is typically more susceptible to change and less readily usable as a [normalized object](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape#designing-a-normalized-state).

### `resolvers`

A **resolver** is a side-effect for a selector. If your selector result may need to be fulfilled from an external source, you can define a resolver such that the first time the selector is called, the fulfillment behavior is effected.

The `resolvers` option should be passed as an object where each key is the name of the selector to act upon, the value a function which receives the same arguments passed to the selector. It can then dispatch as necessary to fulfill the requirements of the selector, taking advantage of the fact that most data consumers will subscribe to subsequent state changes (by `subscribe` or `withSelect`).

### `controls`

_**Note:** Controls are an opt-in feature, enabled via `use` (the [Plugins API](https://github.com/WordPress/gutenberg/tree/master/packages/data/src/plugins))._

A **control** defines the execution flow behavior associated with a specific action type. This can be particularly useful in implementing asynchronous data flows for your store. By defining your action creator or resolvers as a generator which yields specific controlled action types, the execution will proceed as defined by the control handler.

The `controls` option should be passed as an object where each key is the name of the action type to act upon, the value a function which receives the original action object. It should returns either a promise which is to resolve when evaluation of the action should continue, or a value. The value or resolved promise value is assigned on the return value of the yield assignment. If the control handler returns undefined, the execution is not continued.

Refer to the [documentation of `@wordpress/redux-routine`](https://github.com/WordPress/gutenberg/tree/master/packages/redux-routine/) for more information.

## Data Access and Manipulation

It is very rare that you should access store methods directly. Instead, the following suite of functions and higher-order components is provided for the most common data access and manipulation needs.

### Data API

The top-level API of `@wordpress/data` includes a number of functions which allow immediate access to select from and dispatch to a registered store. These are most useful in low-level code where a selector or action dispatch is called a single time or at known intervals. For displaying data in a user interface, you should use [higher-order components](#higher-order-components) instead.

#### `select( storeName: string ): Object`

Given the name of a registered store, returns an object of the store's selectors. The selector functions are been pre-bound to pass the current state automatically. As a consumer, you need only pass arguments of the selector, if applicable.

_Example:_

```js
const { select } = wp.data;

select( 'my-shop' ).getPrice( 'hammer' );
```

#### `dispatch( storeName: string ): Object`

Given the name of a registered store, returns an object of the store's action creators. Calling an action creator will cause it to be dispatched, updating the state value accordingly.

_Example:_

```js
const { dispatch } = wp.data;

dispatch( 'my-shop' ).setPrice( 'hammer', 9.75 );
```

#### `subscribe(): Function`

Given a listener function, the function will be called any time the state value of one of the registered stores has changed. This function returns a `unsubscribe` function used to stop the subscription.

_Example:_

```js
const { subscribe } = wp.data;

const unsubscribe = subscribe( () => {
	// You could use this opportunity to test whether the derived result of a
	// selector has subsequently changed as the result of a state update.
} );

// Later, if necessary...
unsubscribe();
```

### Helpers

#### `combineReducers( reducers: Object ): Function`

As your app grows more complex, you'll want to split your reducing function into separate functions, each managing independent parts of the state. The `combineReducers` helper function turns an object whose values are different reducing functions into a single reducing function you can pass to `registerStore`.

_Example:_

```js
const { combineReducers, registerStore } = wp.data;

const prices = ( state = {}, action ) => {
	return action.type === 'SET_PRICE' ?
		{
			...state,
			[ action.item ]: action.price,
		} :
		state;
};

const discountPercent = ( state = 0, action ) => {
	return action.type === 'START_SALE' ?
		action.discountPercent :
		state;
};

registerStore( 'my-shop', {
	reducer: combineReducers( {
		prices,
		discountPercent,
	} ),
} );
```

### Higher-Order Components

A higher-order component is a function which accepts a [component](https://github.com/WordPress/gutenberg/tree/master/packages/element) and returns a new, enhanced component. A stateful user interface should respond to changes in the underlying state and updates its displayed element accordingly. WordPress uses higher-order components both as a means to separate the purely visual aspects of an interface from its data backing, and to ensure that the data is kept in-sync with the stores.

#### `withSelect( mapSelectToProps: Function ): Function`

Use `withSelect` to inject state-derived props into a component. Passed a function which returns an object mapping prop names to the subscribed data source, a higher-order component function is returned. The higher-order component can be used to enhance a presentational component, updating it automatically when state changes. The mapping function is passed the [`select` function](#select), the props passed to the original component and the `registry` object.

_Example:_

```js
function PriceDisplay( { price, currency } ) {
	return new Intl.NumberFormat( 'en-US', {
		style: 'currency',
		currency,
	} ).format( price );
}

const { withSelect } = wp.data;

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

In the above example, when `HammerPriceDisplay` is rendered into an application, it will pass the price into the underlying `PriceDisplay` component and update automatically if the price of a hammer ever changes in the store.

#### `withDispatch( mapDispatchToProps: Function ): Function`

Use `withDispatch` to inject dispatching action props into your component. Passed a function which returns an object mapping prop names to action dispatchers, a higher-order component function is returned. The higher-order component can be used to enhance a component. For example, you can define callback behaviors as props for responding to user interactions. The mapping function is passed the [`dispatch` function](#dispatch), the props passed to the original component and the `registry` object.

```jsx
function Button( { onClick, children } ) {
	return <button type="button" onClick={ onClick }>{ children }</button>;
}

const { withDispatch } = wp.data;

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
//  <SaleButton discountPercent="20">Start Sale!</SaleButton>
```

In the majority of cases, it will be sufficient to use only two first params passed to `mapDispatchToProps` as illustrated in the previous example. However, there might be some very advanced use cases where using the `registry` object might be used as a tool to optimize the performance of your component. Using `select` function from the registry might be useful when you need to fetch some dynamic data from the store at the time when the event is fired, but at the same time, you never use it to render your component. In such scenario, you can avoid using the `withSelect` higher order component to compute such prop, which might lead to unnecessary re-renders of you component caused by its frequent value change. Keep in mind, that `mapDispatchToProps` must return an object with functions only. 

```jsx
function Button( { onClick, children } ) {
	return <button type="button" onClick={ onClick }>{ children }</button>;
}

const { withDispatch } = wp.data;

const SaleButton = withDispatch( ( dispatch, ownProps, { select } ) => {
	// Stock number changes frequently.
	const { getStockNumber } = select( 'my-shop' );
	const { startSale } = dispatch( 'my-shop' );
	
	return {
		onClick() {
			const dicountPercent = getStockNumber() > 50 ? 10 : 20;
			startSale( discountPercent );
		},
	};
} )( Button );

// Rendered in the application:
//
//  <SaleButton>Start Sale!</SaleButton>
```

*Note:* It is important that the `mapDispatchToProps` function always returns an object with the same keys. For example, it should not contain conditions under which a different value would be returned.

## Generic Stores

The `@wordpress/data` module offers a more advanced and generic interface for the purposes of integrating other data systems and situations where more direct control over a data system is needed. In this case, a data store will need to be implemented outside of `@wordpress/data` and then plugged in via three functions:

- `getSelectors()`: Returns an object of selector functions, pre-mapped to the store.
- `getActions()`: Returns an object of action functions, pre-mapped to the store.
- `subscribe( listener: Function )`: Registers a function called any time the value of state changes.
   - Behaves as Redux [`subscribe`](https://redux.js.org/api-reference/store#subscribe(listener))
   with the following differences:
      - Doesn't have to implement an unsubscribe, since the registry never uses it.
	  - Only has to support one listener (the registry).

By implementing the above interface for your custom store, you gain the benefits of using the registry and the `withSelect` and `withDispatch` higher order components in your application code. This provides seamless integration with existing and alternative data systems.

Integrating an existing redux store with its own reducers, store enhancers and middleware can be accomplished as follows:

_Example:_

```js
import existingSelectors from './existing-app/selectors';
import existingActions from './existing-app/actions';
import createStore from './existing-app/store';

const reduxStore = createStore();

const mappedSelectors = existingSelectors.map( ( selector ) => {
	return ( ...args ) => selector( reduxStore.getState(), ...args );
} );

const mappedActions = existingActions.map( ( action ) => {
	return actions.map( ( action ) => {
		return ( ...args ) => reduxStore.dispatch( action( ...args ) );
	} );
} );

const genericStore = {
	getSelectors() {
		return mappedSelectors;
	},
	getActions() {
		return mappedActions;
	},
	subscribe: reduxStore.subscribe;
};

registry.registerGenericStore( 'existing-app', genericStore );
```

It is also possible to implement a completely custom store from scratch:

_Example:_

```js
function createCustomStore() {
	let storeChanged = () => {};
	const prices = { hammer: 7.50 };

	const selectors = {
		getPrice( itemName ): {
			return prices[ itemName ];
		},
	};

	const actions = {
		setPrice( itemName, price ): {
			prices[ itemName ] = price;
			storeChanged();
		},
	};

	return {
		getSelectors() {
			return selectors;
		},
		getActions() {
			return actions;
		},
		subscribe( listener ) {
			storeChanged = listener;
		}
	};
}

registry.registerGenericStore( 'custom-data', createCustomStore() );
```


## Comparison with Redux

The data module shares many of the same [core principles](https://redux.js.org/introduction/three-principles) and [API method naming](https://redux.js.org/api-reference) of [Redux](https://redux.js.org/). In fact, it is implemented atop Redux. Where it differs is in establishing a modularization pattern for creating separate but interdependent stores, and in codifying conventions such as selector functions as the primary entry point for data access.

The [higher-order components](#higher-order-components) were created to complement this distinction. The intention with splitting `withSelect` and `withDispatch` — where in React Redux they are combined under `connect` as `mapStateToProps` and `mapDispatchToProps` arguments — is to more accurately reflect that dispatch is not dependent upon a subscription to state changes, and to allow for state-derived values to be used in `withDispatch` (via [higher-order component composition](https://github.com/WordPress/gutenberg/tree/master/packages/compose)).

Specific implementation differences from Redux and React Redux:

- In Redux, a `subscribe` listener is called on every dispatch, regardless of whether the value of state has changed.
   - In `@wordpress/data`, a subscriber is only called when state has changed.
- In React Redux, a `mapStateToProps` function must return an object.
   - In `@wordpress/data`, a `withSelect` mapping function can return `undefined` if it has no props to inject.
- In React Redux, the `mapDispatchToProps` argument can be defined as an object or a function.
   - In `@wordpress/data`, the `withDispatch` higher-order component creator must be passed a function.
