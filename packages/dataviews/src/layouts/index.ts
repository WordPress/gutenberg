/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	blockTable,
	category,
	formatListBullets,
	formatListBulletsRTL,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ViewTable from './table';
import ViewGrid from './grid';
import ViewList from './list';
import { LAYOUT_GRID, LAYOUT_LIST, LAYOUT_TABLE } from '../constants';
import type { View } from '../types';

export const VIEW_LAYOUTS = [
	{
		type: LAYOUT_TABLE,
		label: __( 'Table' ),
		component: ViewTable,
		icon: blockTable,
	},
	{
		type: LAYOUT_GRID,
		label: __( 'Grid' ),
		component: ViewGrid,
		icon: category,
	},
	{
		type: LAYOUT_LIST,
		label: __( 'List' ),
		component: ViewList,
		icon: isRTL() ? formatListBulletsRTL : formatListBullets,
	},
];

export function getMandatoryFields( view: View ): string[] {
	if ( view.type === 'table' ) {
		return [ view.layout?.primaryField ]
			.concat(
				view.layout?.combinedFields?.flatMap(
					( field ) => field.children
				) ?? []
			)
			.filter( ( item ): item is string => !! item );
	}

	if ( view.type === 'grid' ) {
		return [ view.layout?.primaryField, view.layout?.mediaField ].filter(
			( item ): item is string => !! item
		);
	}

	if ( view.type === 'list' ) {
		return [ view.layout?.primaryField, view.layout?.mediaField ].filter(
			( item ): item is string => !! item
		);
	}

	return [];
}
