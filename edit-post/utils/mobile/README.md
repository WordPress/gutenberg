mobileMiddleware
===========

`mobileMiddleware` is a very simple [redux middleware](https://redux.js.org/docs/advanced/Middleware.html) that sets the isSidebarOpened flag to false on REDUX_REHYDRATE payloads. 
This useful to make isSidebarOpened false on mobile even if the value that was saved to local storage was true.
The middleware just needs to be added to the enhancers list:

```js
	const enhancers = [
		...
		applyMiddleware( mobileMiddleware ),
	];
	...
	const store = createStore( reducer, flowRight( enhancers ) );
```
