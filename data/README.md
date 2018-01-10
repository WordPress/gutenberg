Data
====

The more WordPress UI moves to the client, the more there's a need for a centralized data module allowing data management and sharing between several WordPress modules and plugins.

This module holds a global state variable and exposes a "Redux-like" API containing the following methods:


### `wp.data.registerReducer( key: string, reducer: function )`

If your module or plugin needs to store and manipulate client-side data, you'll have to register a "reducer" to do so. A reducer is a function taking the previous `state` and `action` and returns an update `state`. You can learn more about reducers on the [Redux Documentation](https://redux.js.org/docs/basics/Reducers.html)

This function takes two arguments: a `key` to identify the module (example: `myAwesomePlugin`) and the reducer function. It returns a Redux-like store object with the following methods:

#### `store.getState()`

Returns the state object of the registered reducer.

#### `store.subscribe( listener: function )`

Registers a `listener` function called everytime the state is updated.

#### `store.dispatch( action: object )`

The dispatch function should be called to trigger the registered reducers function and update the state. An `action` object should be passed to this action. This action is passed to the registered reducers in addition to the previous state.