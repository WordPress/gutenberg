/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { createDatabasePersistenceLayer } from '@wordpress/wp-preferences';

export default async function configurePreferences( defaults ) {
	const databasePersistenceLayer = createDatabasePersistenceLayer();
	await dispatch( preferencesStore ).setPersistenceLayer(
		databasePersistenceLayer
	);
	dispatch( preferencesStore ).setDefaults( 'core/edit-post', defaults );
}
