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
			name: 'frequent',
			title: __( 'Frequent' ),
			className: 'editor-inserter__tab',
		},
		tabScrollTop: 0,
		sortItems(items, state) {
			if (!state.filterValue) {
				return items;
			}
		},
		renderTabView(items) {
			return items;
		}
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
		}
		
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
		}
	},
	{
		options: {
			name: 'shared',
			title: __( 'Shared' ),
			className: 'editor-inserter__tab',
		},
		getItemsForTab() {
			return ( item ) => item.category === 'shared'; 
		}
	},
];

/**
 * Returns all the avialable tabs.
 *
 * @return {Array} tabs.
 */
export function getTabs() {
	if (typeof customGutenberg === 'object' && customGutenberg.tabs) {
		return customGutenberg.tabs;
	}

	return tabs;
}

/**
 * Returns the default tab which should be display first.
 *
 * @return {Object} tab.
 */
export function getDefaultTab() {
	const tabs = getTabs();
	const tab = tabs.filter(tab => tab.default );

	return tab.length ? tab[0] : tabs[0];
}

/**
 * Returns tab by its name.
 *
 * @return {Object} tab.
 */
export function getTabByName(name) {
	return getTabs().reduce((res, tab) => {
		if (tab.options.name == name){
			res = tab;
		}

		return res;
	}, { });
}
