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
import type { View, Field } from '../types';

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

export function getNotHidableFieldIds( view: View ): string[] {
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

function getCombinedFieldIds( view: View ): string[] {
	const combinedFields: string[] = [];
	if ( view.type === LAYOUT_TABLE && view.layout?.combinedFields ) {
		view.layout.combinedFields.forEach( ( combination ) => {
			combinedFields.push( ...combination.children );
		} );
	}
	return combinedFields;
}

export function getVisibleFieldIds(
	view: View,
	fields: Field< any >[]
): string[] {
	const fieldsToExclude = getCombinedFieldIds( view );

	if ( view.fields ) {
		return view.fields.filter( ( id ) => ! fieldsToExclude.includes( id ) );
	}

	const visibleFields = [];
	if ( view.type === LAYOUT_TABLE && view.layout?.combinedFields ) {
		visibleFields.push(
			...view.layout.combinedFields.map( ( { id } ) => id )
		);
	}
	visibleFields.push(
		...fields
			.filter( ( { id } ) => ! fieldsToExclude.includes( id ) )
			.map( ( { id } ) => id )
	);

	return visibleFields;
}

export function getHiddenFieldIds(
	view: View,
	fields: Field< any >[]
): string[] {
	const fieldsToExclude = [
		...getCombinedFieldIds( view ),
		...getVisibleFieldIds( view, fields ),
	];

	// The media field does not need to be in the view.fields to be displayed.
	if ( view.type === LAYOUT_GRID && view.layout?.mediaField ) {
		fieldsToExclude.push( view.layout?.mediaField );
	}

	if ( view.type === LAYOUT_LIST && view.layout?.mediaField ) {
		fieldsToExclude.push( view.layout?.mediaField );
	}

	return fields
		.filter(
			( { id, enableHiding } ) =>
				! fieldsToExclude.includes( id ) && enableHiding
		)
		.map( ( { id } ) => id );
}
