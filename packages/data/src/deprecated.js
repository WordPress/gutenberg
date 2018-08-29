/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import * as persistence from './plugins/persistence';

/**
 * Higher-order reducer used to persist just one key from the reducer state.
 *
 * @param {function} reducer    Reducer function.
 * @param {string} keyToPersist The reducer key to persist.
 *
 * @return {function} Updated reducer.
 */
export function restrictPersistence( reducer, keyToPersist ) {
	deprecated( 'wp.data.restrictPersistence', {
		alternative: 'registerStore persist option with persistence plugin',
		version: '3.7',
		plugin: 'Gutenberg',
		hint: 'See https://github.com/WordPress/gutenberg/pull/8341 for more details',
	} );

	reducer.__deprecatedKeyToPersist = keyToPersist;

	return reducer;
}

/**
 * Sets a different persistence storage.
 *
 * @param {Object} storage Persistence storage.
 */
export function setPersistenceStorage( storage ) {
	deprecated( 'wp.data.setPersistenceStorage', {
		alternative: 'persistence plugin with storage option',
		version: '3.7',
		plugin: 'Gutenberg',
		hint: 'See https://github.com/WordPress/gutenberg/pull/8341 for more details',
	} );

	const originalCreatePersistenceInterface = persistence.createPersistenceInterface;
	persistence.createPersistenceInterface = ( options ) => {
		originalCreatePersistenceInterface( {
			storage,
			...options,
		} );
	};
}
