/**
 * Internal dependencies
 */
import moveFeaturePreferences from './move-feature-preferences';
import moveThirdPartyFeaturePreferences from './move-third-party-feature-preferences';
import moveIndividualPreference from './move-individual-preference';
import moveInterfaceEnableItems from './move-interface-enable-items';
import convertEditPostPanels from './convert-edit-post-panels';

/**
 * Gets the legacy local storage data for a given user.
 *
 * @param {string | number} userId The user id.
 *
 * @return {Object | null} The local storage data.
 */
function getLegacyData( userId ) {
	const key = `WP_DATA_USER_${ userId }`;
	const unparsedData = window.localStorage.getItem( key );
	return JSON.parse( unparsedData );
}

/**
 * Converts data from the old `@wordpress/data` package format.
 *
 * @param {Object | null | undefined} data The legacy data in its original format.
 *
 * @return {Object | undefined} The converted data or `undefined` if there was
 *                              nothing to convert.
 */
export function convertLegacyData( data ) {
	if ( ! data ) {
		return;
	}

	// Move boolean feature preferences from each editor into the
	// preferences store data structure.
	data = moveFeaturePreferences( data, 'core/edit-widgets' );
	data = moveFeaturePreferences( data, 'core/customize-widgets' );
	data = moveFeaturePreferences( data, 'core/edit-post' );
	data = moveFeaturePreferences( data, 'core/edit-site' );

	// Move third party boolean feature preferences from the interface package
	// to the preferences store data structure.
	data = moveThirdPartyFeaturePreferences( data );

	// Move and convert the interface store's `enableItems` data into the
	// preferences data structure.
	data = moveInterfaceEnableItems( data );

	// Move individual ad-hoc preferences from various packages into the
	// preferences store data structure.
	data = moveIndividualPreference(
		data,
		{ from: 'core/edit-post', to: 'core/edit-post' },
		'hiddenBlockTypes'
	);
	data = moveIndividualPreference(
		data,
		{ from: 'core/edit-post', to: 'core/edit-post' },
		'editorMode'
	);
	data = moveIndividualPreference(
		data,
		{ from: 'core/edit-post', to: 'core/edit-post' },
		'panels',
		convertEditPostPanels
	);
	data = moveIndividualPreference(
		data,
		{ from: 'core/editor', to: 'core' },
		'isPublishSidebarEnabled'
	);
	data = moveIndividualPreference(
		data,
		{ from: 'core/edit-post', to: 'core' },
		'isPublishSidebarEnabled'
	);
	data = moveIndividualPreference(
		data,
		{ from: 'core/edit-site', to: 'core/edit-site' },
		'editorMode'
	);

	// The new system is only concerned with persisting
	// 'core/preferences' preferences reducer, so only return that.
	return data?.[ 'core/preferences' ]?.preferences;
}

/**
 * Gets the legacy local storage data for the given user and returns the
 * data converted to the new format.
 *
 * @param {string | number} userId The user id.
 *
 * @return {Object | undefined} The converted data or undefined if no local
 *                              storage data could be found.
 */
export default function convertLegacyLocalStorageData( userId ) {
	const data = getLegacyData( userId );
	return convertLegacyData( data );
}
