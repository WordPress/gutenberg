declare interface Window {
	__REDUX_DEVTOOLS_EXTENSION__: Function | undefined;
}

declare module 'turbo-combine-reducers' {
	import * as Redux from 'redux';

	export = Redux.combineReducers;
}
