/**
 * Internal dependencies
 */
import type { NormalizedField } from '../types';
import type { FieldType } from '../types/private';
import render from './utils/render-default';

/**
 * Format group value for display by joining property display values.
 */
function getValueFormatted< Item >( {
	item,
	field,
}: {
	item: Item;
	field: NormalizedField< Item >;
} ): string {
	const { properties } = field;

	if ( ! properties || Object.keys( properties ).length === 0 ) {
		return '';
	}

	return Object.values( properties )
		.map( ( propField ) =>
			propField.getValueFormatted( { item, field: propField } )
		)
		.filter( Boolean )
		.join( ', ' );
}

export default {
	type: 'group',
	render,
	Edit: 'group',
	sort: () => 0,
	enableSorting: false,
	enableGlobalSearch: false,
	defaultOperators: [],
	validOperators: [],
	format: {},
	getValueFormatted,
	validate: {},
} satisfies FieldType< any >;
