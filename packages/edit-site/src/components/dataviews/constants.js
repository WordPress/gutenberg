/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
export const LAYOUT_SIDE_BY_SIDE = 'side-by-side';

export const VIEW_LAYOUTS = [
	{
		type: LAYOUT_TABLE,
		label: __( 'Table' ),
		component: ViewList,
	},
	{
		type: LAYOUT_GRID,
		label: __( 'Grid' ),
		component: ViewGrid,
	},
	{
		type: LAYOUT_SIDE_BY_SIDE,
		label: __( 'Side by side' ),
		component: ViewSideBySide,
	},
];

export const VIEW_SUPPORTS = {
	[ LAYOUT_TABLE ]: {},
	[ LAYOUT_GRID ]: {},
	[ LAYOUT_SIDE_BY_SIDE ]: {
		preview: true,
	},
};
