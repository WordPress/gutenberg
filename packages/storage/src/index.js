/**
 * External dependencies
 */
import localforage from 'localforage';

/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Returns a localForage instance given a storeName.
 *
 * @param {string}   storeName   alphanumeric+underscore identifier for
 *                               a store. Passed to localForage's `config()`
 *                               method as the `storeName` prop.
 *
 * @return {localforage} localForage instance
 */
export default function createStorage( storeName ) {
	if ( ! storeName || ! storeName.length ) {
		throw new Error( 'storeName is required for editor/utils/storage' );
	}

	return localforage.createInstance( {
		name: 'WordPress Editor',
		storeName,
	} );
}

const DEFAULT_STATE = {};

const actions = {
	getItem( storeName, key ) {
		return {
			type: 'GET_STORAGE_ITEM',
			key,
			storeName,
		};
	},

	getItemFromStorageBackend( storeName, key ) {
		return {
			type: 'GET_STORAGE_ITEM_FROM_STORAGE_BACKEND',
			key,
			storeName,
		};
	},

	setItem( storeName, key, value ) {
		return {
			type: 'SET_STORAGE_ITEM',
			key,
			storeName,
			value,
		};
	},
};

registerStore( 'storage', {
	reducer( state = DEFAULT_STATE, action ) {
		switch ( action.type ) {
			case 'RETRIEVE_STORAGE_ITEM':
				return {
					...state,
					[ action.storageName ]: {
						[ action.key ]: action.value,
					},
				};
		}

		return state;
	},

	actions,

	selectors: {},

	controls: {
		GET_STORAGE_ITEM_FROM_STORAGE_BACKEND( action ) {
			return createStorage( action.storeName ).getItem( action.key );
		},
		SET_ITEM( action ) {
			return createStorage( action.storeName ).setItem( action.key, action.value );
		},
	},

	resolvers: {
		* getItem( state, storeName, key ) {
			const value = yield actions.getItemFromStorageBackend( storeName, key );

			return actions.retrieveStorageItem( storeName, key, value );
		},
		* setItem( state, storeName, key, value ) {
			yield actions.setItemInStorageBackend( storeName, key, value );

			return actions.retrieveStorageItem( storeName, key, value );
		},
	},
} );
