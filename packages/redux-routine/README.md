# @wordpress/redux-routine

Redux middleware for generator coroutines.

## Installation

Install Node if you do not already have it available.

Install the module to your project using `npm`:

```bash
npm install @wordpress/redux-routine
```

`@wordpress/redux-routine` leverages both Promises and Generators, two modern features of the JavaScript language. If you need to support older browsers (Internet Explorer 11 or earlier), you will need to provide your own polyfills.

## Usage

The default export of `@wordpress/redux-routine` is a function which, given an object of control handlers, returns a Redux middleware function.

For example, consider a common case where we need to issue a network request. We can define the network request as a control handler when creating our middleware.

```js
import { combineReducers, createStore, applyMiddleware } from 'redux';
import createRoutineMiddleware from '@wordpress/redux-routine';

const middleware = createRoutineMiddleware( {
	async FETCH_JSON( action ) {
		const response = await window.fetch( action.url );
		return response.json();
	},
} );

function temperature( state = null, action ) {
	switch ( action.type ) {
		case 'SET_TEMPERATURE':
			return action.temperature;
	}

	return state;
}

const reducer = combineReducers( { temperature } );

const store = createStore( reducer, applyMiddleware( middleware ) );

function* retrieveTemperature() {
	const result = yield { type: 'FETCH_JSON', url: 'https://' };
	return { type: 'SET_TEMPERATURE', temperature: result.value };
}

store.dispatch( retrieveTemperature() );
```

In this example, when we dispatch `retrieveTemperature`, it will trigger the control handler to take effect, issuing the network request and assigning the result into the `result` variable. Only once the
request has completed does the action creator procede to return the `SET_TEMPERATURE` action type.

## API

### `createMiddleware( controls: ?Object )`

Create a Redux middleware, given an object of controls where each key is an action type for which to act upon, the value a function which returns either a promise which is to resolve when evaluation of the action should continue, or a value. The value or resolved promise value is assigned on the return value of the yield assignment. If the control handler returns undefined, the execution is not continued.

## Motivation

`@wordpress/redux-routine` shares many of the same motivations as other similar generator-based Redux side effects solutions, including `redux-saga`. Where it differs is in being less opinionated by virtue of its minimalism. It includes no default controls, offers no tooling around splitting logic flows, and does not include any error handling out of the box. This is intended in promoting approachability to developers who seek to bring asynchronous or conditional continuation flows to their applications without a steep learning curve.

The primary motivations include, among others:

- **Testability**: Since an action creator yields plain action objects, the behavior of their resolution can be easily substituted in tests.
- **Controlled flexibility**: Control flows can be implemented without sacrificing the expressiveness and intentionality of an action type. Other solutions like thunks or promises promote ultimate flexibility, but at the expense of maintainability manifested through deep coupling between action types and incidental implementation.
- A **common domain language** for expressing data flows: Since controls are centrally defined, it requires the conscious decision on the part of a development team to decide when and how new control handlers are added.

## Testing

Since your action creators will return an iterable generator of plain action objects, they are trivial to test.

Consider again our above example:

```js
function* retrieveTemperature() {
	const result = yield { type: 'FETCH_JSON', url: 'https://' };
	return { type: 'SET_TEMPERATURE', temperature: result.value };
}
```

A test case (using Node's `assert` built-in module) may be written as:

```js
import { deepEqual } from 'assert';

const action = retrieveTemperature();

deepEqual( action.next().value, {
	type: 'FETCH_JSON',
	url: 'https://',
} );

const jsonResult = { value: 10 };
deepEqual( action.next( jsonResult ).value, {
	type: 'SET_TEMPERATURE',
	temperature: 10,
} );
```

If your action creator does not assign the yielded result into a variable, you can also use `Array.from` to create an array from the result of the action creator.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
