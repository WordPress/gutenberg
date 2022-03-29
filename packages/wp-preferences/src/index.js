/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import createDatabasePersistenceLayer from './database-persistence-layer';
import migrate from './migrations';

export * from './components';

export async function configurePreferences( { defaults, storageKey } ) {
	const databasePersistenceLayer = createDatabasePersistenceLayer( {
		storageKey,
		__unstableMigrate: migrate,
	} );

	await dispatch( preferencesStore ).setPersistenceLayer(
		databasePersistenceLayer
	);

	dispatch( preferencesStore ).setDefaults( 'core/edit-post', defaults );
}
