/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { blockTable, category, drawerLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ViewList from './view-list';
import ViewGrid from './view-grid';
import ViewSideBySide from './view-side-by-side';

// Field types.
export const ENUMERATION_TYPE = 'enumeration';

// Filter operators.
export const OPERATOR_IN = 'in';

// View layouts.
export const LAYOUT_TABLE = 'table';
export const LAYOUT_GRID = 'grid';
export const LAYOUT_LIST = 'list';

export const VIEW_LAYOUTS = [
	{
		type: LAYOUT_TABLE,
		label: __( 'Table' ),
		component: ViewList,
		icon: blockTable,
		supports: {
			preview: false,
		},
	},
	{
		type: LAYOUT_GRID,
		label: __( 'Grid' ),
		component: ViewGrid,
		icon: category,
		supports: {
			preview: false,
		},
	},
	{
		type: LAYOUT_LIST,
		label: __( 'List' ),
		component: ViewSideBySide,
		icon: drawerLeft,
		supports: {
			preview: true,
		},
	},
];
