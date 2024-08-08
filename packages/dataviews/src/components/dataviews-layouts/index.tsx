/**
 * External dependencies
 */
import type { ComponentType } from 'react';

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
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ViewTable from './table';
import ViewGrid from './grid';
import ViewList from './list';
import { LAYOUT_GRID, LAYOUT_LIST, LAYOUT_TABLE } from '../../utils/constants';
import type { View, ViewBaseProps } from '../../types';
import DataViewsContext from '../dataviews-context';

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

export default function DataViewsLayout() {
	const {
		actions = [],
		data,
		fields,
		getItemId,
		isLoading,
		view,
		onChangeView,
		selection,
		onChangeSelection,
		setOpenedFilter,
		density,
	} = useContext( DataViewsContext );

	const ViewComponent = VIEW_LAYOUTS.find( ( v ) => v.type === view.type )
		?.component as ComponentType< ViewBaseProps< any > >;

	return (
		<ViewComponent
			actions={ actions }
			data={ data }
			fields={ fields }
			getItemId={ getItemId }
			isLoading={ isLoading }
			onChangeView={ onChangeView }
			onChangeSelection={ onChangeSelection }
			selection={ selection }
			setOpenedFilter={ setOpenedFilter }
			view={ view }
			density={ density }
		/>
	);
}
