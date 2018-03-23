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
		tabScrollTop: 0
		
	},
	// {
	// 	name: 'rows',
	// 	title: __( 'Rows' ),
	// 	className: 'editor-inserter__tab',
	// },
	{
		options: {
			name: 'blocks',
			title: __( 'Blocks' ),
			className: 'editor-inserter__tab',
		},
		tabScrollTop: 0
		
	},
	{
		options: {
			name: 'embeds',
			title: __( 'Embeds' ),
			className: 'editor-inserter__tab',
		},
		tabScrollTop: 0
		
	},
	{
		options: {
			name: 'shared',
			title: __( 'Shared' ),
			className: 'editor-inserter__tab',
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
