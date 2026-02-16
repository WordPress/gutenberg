/**
 * WordPress dependencies
 */
import { getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type { NormalizedField, SortDirection } from '../types';
import type { FieldType } from '../types/private';
import isValidElements from './utils/is-valid-elements';
import {
	OPERATOR_ON,
	OPERATOR_NOT_ON,
	OPERATOR_BEFORE,
	OPERATOR_AFTER,
	OPERATOR_BEFORE_INC,
	OPERATOR_AFTER_INC,
	OPERATOR_IN_THE_PAST,
	OPERATOR_OVER,
} from '../constants';
import isValidRequired from './utils/is-valid-required';
import render from './utils/render-default';
import parseDateTime from './utils/parse-date-time';

const format = {
	datetime: getSettings().formats.datetime,
	weekStartsOn: getSettings().l10n.startOfWeek,
};

function getValueFormatted< Item >( {
	item,
	field,
}: {
	item: Item;
	field: NormalizedField< Item >;
} ): string {
	const value = field.getValue( { item } );
	if ( [ '', undefined, null ].includes( value ) ) {
		return '';
	}

	const dateValue = parseDateTime( value );
	return dateValue !== null ? dateValue.toLocaleString() : '';
}

const sort = ( a: any, b: any, direction: SortDirection ) => {
	const timeA = new Date( a ).getTime();
	const timeB = new Date( b ).getTime();

	return direction === 'asc' ? timeA - timeB : timeB - timeA;
};

export default {
	type: 'datetime',
	render,
	Edit: 'datetime',
	sort,
	enableSorting: true,
	enableGlobalSearch: false,
	defaultOperators: [
		OPERATOR_ON,
		OPERATOR_NOT_ON,
		OPERATOR_BEFORE,
		OPERATOR_AFTER,
		OPERATOR_BEFORE_INC,
		OPERATOR_AFTER_INC,
		OPERATOR_IN_THE_PAST,
		OPERATOR_OVER,
	],
	validOperators: [
		OPERATOR_ON,
		OPERATOR_NOT_ON,
		OPERATOR_BEFORE,
		OPERATOR_AFTER,
		OPERATOR_BEFORE_INC,
		OPERATOR_AFTER_INC,
		OPERATOR_IN_THE_PAST,
		OPERATOR_OVER,
	],
	format,
	getValueFormatted,
	validate: {
		required: isValidRequired,
		elements: isValidElements,
	},
} satisfies FieldType< any >;
