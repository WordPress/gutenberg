/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Menu tabs.
 *
 * @var {Array} tabs
 */
const tabs = [
	{
		options: {
			name: 'suggested',
			title: __( 'Suggested' ),
			className: 'editor-inserter__tab',
		},
		tabScrollTop: 0,
		sortItems( items, state ) {
			if ( ! state.filterValue ) {
				return items;
			}
		},
		// If the Suggested tab is selected, don't render category headers
		renderTabView( items ) {
			return items;
		},
	},
	{
		options: {
			name: 'blocks',
			title: __( 'Blocks' ),
			className: 'editor-inserter__tab',
		},
		tabScrollTop: 0,
		getItemsForTab() {
			return ( item ) => item.category !== 'embed' && item.category !== 'shared';
		},
	},
	{
		options: {
			name: 'embeds',
			title: __( 'Embeds' ),
			className: 'editor-inserter__tab',
		},
		tabScrollTop: 0,
		getItemsForTab() {
			return ( item ) => item.category === 'embed';
		},
	},
	{
		options: {
			name: 'shared',
			title: __( 'Shared' ),
			className: 'editor-inserter__tab',
		},
		getItemsForTab() {
			return ( item ) => item.category === 'shared';
		},
	},
];

/**
 * Returns all the available tabs.
 *
 * @return {Array} tabs.
 */
export function getTabs() {
	const customTabs = get( window, 'customGutenberg.tabs' );
	return customTabs || tabs;
}

/**
 * Returns the default tab which should be display first.
 *
 * @return {Object} tab.
 */
export function getDefaultTab() {
	const tabsList = getTabs();
	const defaultTabs = tabsList.filter( ( tab ) => tab.default );

	// return default tab or the first of the array
	return defaultTabs.length ? defaultTabs[ 0 ] : tabsList[ 0 ];
}

/**
 * Returns tab by its name.
 * @param {string} name            Tab name.
 *
 * @return {Object} tab.
 */
export function getTabByName( name ) {
	return getTabs().reduce( ( res, tab ) => {
		if ( tab.options.name === name ) {
			res = tab;
		}

		return res;
	}, { } );
}
