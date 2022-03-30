/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import create from './create';

export { create };

export function __experimentalConfigureDatabasePersistenceLayer( options ) {
	const persistenceLayer = create( { options } );
	dispatch( preferencesStore ).setPersistenceLayer( persistenceLayer );
}
