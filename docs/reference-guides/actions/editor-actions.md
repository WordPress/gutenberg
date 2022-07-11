# Editor Actions

To help you hook into the editor lifecycle and extend it, the following Actions are exposed:

### Error Boundaries

#### `editor.ErrorBoundary.errorLogged`

Allows you to hook into the editor Error Boundaries' `componentDidCatch` and gives you access to the error object.

You can use if you want to get hold of the error object that's handled by the boundaries, i.e to send them to an external error tracking tool.

_Example_:

```js
addAction(
	'editor.ErrorBoundary.errorLogged',
	'mu-plugin/error-capture-setup',
	( error ) => {
		// error is the exception's error object
		ErrorCaptureTool.captureError( error );
	}
);
```
