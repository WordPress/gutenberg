/**
 * WordPress dependencies
 */
import { DataStores, ReduxStoreConfig, DataRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
// import * as actions from './actions';
// import * as selectors from './selectors';

// type CoreDataState = {};
// declare module '@wordpress/data' {
// 	interface Stores extends DataStores {
// 		'core-data': ReduxStoreConfig<
// 			CoreDataState,
// 			typeof actions,
// 			typeof selectors
// 		>;
// 	}
// }
//
// const x = {} as DataRegistry;
// x.select( 'core-data' ).getEntityRecords( 'a', 'b', {} );

export {};

export interface AnyFunction {
	( ...args: any[] ): any;
}
