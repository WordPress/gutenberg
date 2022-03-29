/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, resolveSelect } from '@wordpress/data';
import createPersistenceLayer from '@wordpress/persistence-local-storage';
import { store as preferencesStore } from '@wordpress/preferences';

export default async function configurePreferences( defaults ) {
	const currentUser = await resolveSelect( coreStore ).getCurrentUser();
	const localStoragePersistenceLayer = createPersistenceLayer( {
		storageKey: currentUser
			? `WP_DATA_USER_${ currentUser?.id }`
			: 'WP_DATA',
	} );
	await dispatch( preferencesStore ).setPersistenceLayer(
		localStoragePersistenceLayer
	);
	dispatch( preferencesStore ).setDefaults( 'core/edit-post', defaults );
}
