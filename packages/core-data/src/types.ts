// export interface AnyFunction {
// 	( ...args: any[] ): any;
// }
//
// /**
//  * Internal dependencies
//  */
// import {
// 	DataStores,
// 	ReduxStoreConfig,
// 	DataRegistry,
// } from '@wordpress/data';
// // } from '../../data/build-types/types';
// // import { DataStores, ReduxStoreConfig, DataRegistry } from '@wordpress/data';
//
// import * as actions from './actions';
// import * as selectors from './selectors';
//
// type CoreDataState = {};
// declare module '../../data/build-types/types' {
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
//
export {};
