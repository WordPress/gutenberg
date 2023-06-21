# Rememo

Memoized selectors for Redux and other immutable object derivation.

## Usage

Rememo's default export is a function which accepts two arguments: the selector function whose return value is to be cached, and a second function which returns the reference or array of references upon which the selector's derivation depends. The return value is a new function which accepts the same arguments as the selector.

```js
import createSelector from 'rememo';

const getTasksByCompletion = createSelector(
	// The expensive computation:
	(state, isComplete) =>
		state.todo.filter((task) => task.complete === isComplete),

	// The reference(s) upon which the computation depends:
	(state) => [state.todo]
);

// The selector will only calculate the return value once so long as the state
// `todo` reference remains the same
let completedTasks;
completedTasks = getTasksByCompletion(state, true); // Computed
completedTasks = getTasksByCompletion(state, true); // Returned from cache
```

## Installation

Rememo is published as an [npm](https://www.npmjs.com/) package:

```
npm install rememo
```

Browser-ready versions are available from [unpkg](https://unpkg.com/rememo/dist/rememo.min.js). The browser-ready version assigns itself on the global scope as `window.rememo`.

```html
<script src="https://unpkg.com/rememo/dist/rememo.min.js"></script>
<script>
	var createSelector = window.rememo;

	// ...
</script>
```

## API

Rememo's default export is a function:

```typescript
createSelector(
	selector: (...args: any[]) => any,
	getDependants?: (...args: any[]) => any[],
): (...args: any[]) => any
```

The returned function is a memoized selector with the following signature:

```typescript
memoizedSelector(source: object, ...args: any[]): any
```

It's expected that the first argument to the memoized function is the source from which the selector operates. It is ignored when considering whether the argument result has already been cached.

The memoized selector function includes two additional properties:

- `clear()`: When invoked, resets memoization cache.
- `getDependants(source: Object, ...args: any[])`: The dependants getter for the selector.

The `getDependants` property can be useful when creating selectors which compose other memoized selectors, in which case the dependants are the union of the two selectors' dependants:

```js
const getTasksByCompletion = createSelector(
	(state, isComplete) =>
		state.todo.filter((task) => task.complete === isComplete),
	(state) => [state.todo]
);

const getTasksByCompletionForCurrentDate = createSelector(
	(state, isComplete) =>
		getTasksByCompletion(state, isComplete).filter(
			(task) => task.date === state.currentDate
		),
	(state, isComplete) => [
		...getTasksByCompletion.getDependants(state, isComplete),
		state.currentDate,
	]
);
```

## Motivation

While designed specifically for use with [Redux](http://redux.js.org/), Rememo is a simple pattern for efficiently deriving values from any immutable data object. Rememo takes advantage of Redux's [core principles](http://redux.js.org/docs/introduction/ThreePrinciples.html) of [data normalization](http://redux.js.org/docs/recipes/reducers/NormalizingStateShape.html) and [immutability](http://redux.js.org/docs/faq/ImmutableData.html). While tracking normalized data in a Redux store is beneficial for eliminating redudancy and reducing overall memory storage, in doing so it sacrifices conveniences that would otherwise make for a pleasant developer experience. It's for this reason that a selector pattern can be desirable. A selector is nothing more than a function which receives the current state and optionally a set of arguments to be used in determining the calculated value.

For example, consider the following state structure to describe a to-do list application:

```js
const state = {
	todo: [
		{ text: 'Go to the gym', complete: true },
		{ text: 'Try to spend time in the sunlight', complete: false },
		{ text: 'Laundry must be done', complete: true },
	],
};
```

If we wanted to filter tasks by completion, we could write a simple function:

```js
function getTasksByCompletion(state, isComplete) {
	return state.todo.filter((task) => task.complete === isComplete);
}
```

This works well enough and requires no additional tools, but you'll observe that the filtering we perform on the set of to-do tasks could become costly if we were to have thousands of tasks. And this is just a simple example; real-world use cases could involve far more expensive computation. Add to this the very real likelihood that our application might call this function many times even when our to-do set has not changed.

Furthermore, when used in combination with [`React.PureComponent`](https://reactjs.org/docs/react-api.html#reactpurecomponent) or [`react-redux`](https://github.com/reactjs/react-redux)'s `connect` — which creates pure components by default — it is advisable to pass unchanging object and array references as props on subsequent renders. A selector which returns a new reference on each invocation (as occurs with `Array#map` or `Array#filter`), your component will needlessly render even if the underlying data does not change.

This is where Rememo comes in: a Rememo selector will cache the resulting value so long as the references upon which it depends have not changed. This works particularly well for immutable data structures, where we can perform a trivial strict equality comparison (`===`) to determine whether state has changed. Without guaranteed immutability, equality can only be known by deeply traversing the object structure, an operation which in many cases is far more costly than the original computation.

In our above example, we know the value of the function will only change if the set of to-do's has changed. It's in Rememo's second argument that we describe this dependency:

```js
const getTasksByCompletion = createSelector(
	(state, isComplete) =>
		state.todo.filter((task) => task.complete === isComplete),
	(state) => [state.todo]
);
```

Now we can call `getTasksByCompletion` as many times as we want without needlessly wasting time filtering tasks when the `todo` set has not changed.

## Testing

To simplify testing of memoized selectors, the function returned by `createSelector` includes a `clear` function:

```js
const getTasksByCompletion = require('../selector');

// Test licecycle management varies by runner. This example uses Mocha.
beforeEach(() => {
	getTasksByCompletion.clear();
});
```

Alternatively, you can create separate references (exports) for your memoized and unmemoized selectors, then test only the unmemoized selector.

Refer to [Rememo's own tests](https://github.com/aduth/rememo/tree/master/test/rememo.js) as an example.

## FAQ

**How does this differ from [Reselect](https://github.com/reactjs/reselect), another selector memoization library?**

Reselect and Rememo largely share the same goals, but have slightly different implementation semantics. Reselect optimizes for function composition, requiring that you pass as arguments functions returning derived data of increasing specificity. Constrasting it to our to-do example above, with Reselect we would pass two arguments: a function which retrieves `todo` from the state object, and a second function which receives that set as an argument and performs the completeness filter. The distinction is not as obvious with a simple example like this one, and can be seen more clearly with examples in [Reselect's README](https://github.com/reactjs/reselect#readme).

Rememo instead encourages you to consider the derivation first-and-foremost without requiring you to build up the individual dependencies ahead of time. This is especially convenient if your computation depends on many disparate state paths, or if you choose not to memoize all selectors and would rather opt-in to caching at your own judgment. Composing selectors is still straight-forward in Rememo if you subscribe to the convention of passing `state` always as the first argument, since this enables your selectors to call upon other each other passing the complete state object.

## License

Copyright 2018-2022 Andrew Duthie

Released under the [MIT License](https://github.com/aduth/rememo/tree/master/LICENSE.md).
