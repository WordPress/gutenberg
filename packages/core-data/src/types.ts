/**
 * WordPress dependencies
 */
import { DataRegistry, DataStores, ReduxStoreConfig } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import * as selectors from './selectors';

type CoreDataState = {};
declare module '@wordpress/data' {
	interface Stores extends DataStores {
		'core-data': ReduxStoreConfig<
			CoreDataState,
			typeof actions,
			typeof selectors
		>;
	}
}

//
const x = {} as DataRegistry;
x.select( 'core-data' ).getCurrentUser();
x.select( 'core-data' ).getEntityRecord( 'root', 'comment', 15 );

export {};

export interface AnyFunction {
	( ...args: any[] ): any;
}
