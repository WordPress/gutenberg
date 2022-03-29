/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, resolveSelect } from '@wordpress/data';
import {
	createLocalStoragePersistenceLayer,
	store as preferencesStore,
} from '@wordpress/preferences';

export default async function configurePreferences( defaults ) {
	const currentUser = await resolveSelect( coreStore ).getCurrentUser();
	const localStoragePersistenceLayer = createLocalStoragePersistenceLayer( {
		storageKey: currentUser
			? `WP_DATA_USER_${ currentUser?.id }`
			: 'WP_DATA',
	} );
	await dispatch( preferencesStore ).setPersistenceLayer(
		localStoragePersistenceLayer
	);
	dispatch( preferencesStore ).setDefaults( 'core/edit-post', defaults );
}
