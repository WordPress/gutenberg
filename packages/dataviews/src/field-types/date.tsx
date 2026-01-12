/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type { FormatDate, NormalizedField, SortDirection } from '../types';
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
	OPERATOR_BETWEEN,
} from '../constants';
import isValidRequired from './utils/is-valid-required';
import render from './utils/render-default';

const format = {
	date: getSettings().formats.date,
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

	let formatDate: Required< FormatDate >;
	if ( field.type !== 'date' ) {
		formatDate = format;
	} else {
		formatDate = field.format as Required< FormatDate >;
	}

	return dateI18n( formatDate.date, getDate( value ) );
}

const sort = ( a: any, b: any, direction: SortDirection ) => {
	const timeA = new Date( a ).getTime();
	const timeB = new Date( b ).getTime();

	return direction === 'asc' ? timeA - timeB : timeB - timeA;
};

export default {
	type: 'date',
	render,
	Edit: 'date',
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
		OPERATOR_BETWEEN,
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
		OPERATOR_BETWEEN,
	],
	format,
	getValueFormatted,
	validate: {
		required: isValidRequired,
		elements: isValidElements,
	},
} satisfies FieldType< any >;
