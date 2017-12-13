Data
====

The more WordPress UI moves to the client, the more there's a need for a centralized data module allowing data management and sharing between several WordPress modules and plugins.

This module holds a global state variable and exposes a "Redux-like" API containing the following methods:


### `wp.data.registerReducer( reducer: function )`

If your module or plugin needs to store and manipulate client-side data, you'll have to register a "reducer" to do so. A reducer is a function taking the previous `state` and `action` and returns an update `state`. You can learn more about reducers on the [Redux Documentation](https://redux.js.org/docs/basics/Reducers.html)

### `wp.data.getState()`

A simple function to returns the JS object containing the state of all the WP Modules.
This function is present for convenience to use things like `react-redux`.
You should not use rely on other modules state since the state object's shape may change over time breaking your module.
An official way to expose your module's state will be added later.

### `wp.data.subscribe( listener: function )`

Registers a `listener` function called everytime the state is updated.

### `wp.data.dispatch( action: object )`

The dispatch function should be called to trigger the registered reducers function and update the state. An `action` object should be passed to this action. This action is passed to the registered reducers in addition to the previous state.