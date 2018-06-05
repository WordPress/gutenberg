/**
 * External dependencies
 */
import { get, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Available categories
 * @type {Array} Categories list
 */
export const DEFAULT_CATEGORIES = get( window, [ 'customGutenberg', 'categories' ] ) || [
	{ slug: 'rows', title: __( 'Rows Blocks' ) },
	{ slug: 'common', title: __( 'Common Blocks' ) },
	{ slug: 'formatting', title: __( 'Formatting' ) },
	{ slug: 'layout', title: __( 'Layout Elements' ) },
	{ slug: 'widgets', title: __( 'Widgets' ) },
	{ slug: 'embed', title: __( 'Embeds' ) },
	{ slug: 'shared', title: __( 'Shared Blocks' ) },
];

/**
 * Available categories to display in inserter menu
 * @return {Array} Categories list
 */
function getInserterMenuCategories() {
	const categories = get( window, [ 'customGutenberg', 'blocks', 'categories' ], map( DEFAULT_CATEGORIES, 'slug' ) );

	if ( categories !== DEFAULT_CATEGORIES ) {
		return categories.map( ( cat ) => {
			return DEFAULT_CATEGORIES.find( ( { slug } ) => slug === cat );
		} );
	}
}

/**
 * Available Inserter Menu panels
 * @type {Object} Panels
 */
export const DEFAULT_INSERTER_MENU_PANELS = {
	// To do set default props like title, etc { title: __( 'Most Used' ) },
	suggested: get( window, [ 'customGutenberg', 'blocks', 'suggested' ], true ),
	shared: get( window, [ 'customGutenberg', 'blocks', 'shared' ], true ),
	categories: getInserterMenuCategories(),
};
