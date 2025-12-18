/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	Field,
	FormatDatetime,
	SortDirection,
} from '../types';
import type { FieldType } from '../types/private';
import RenderFromElements from './utils/render-from-elements';
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
	DAYS_OF_WEEK,
} from '../constants';
import isValidRequired from './utils/is-valid-required';

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	if ( field.elements ) {
		return <RenderFromElements item={ item } field={ field } />;
	}

	const value = field.getValue( { item } );
	if ( [ '', undefined, null ].includes( value ) ) {
		return null;
	}

	// If the field type is datetime, we've already normalized the format,
	// and so it's safe to tell TypeScript to trust us ("as Required<Format>").
	//
	// There're no runtime paths where this render function is called with a non-datetime field,
	// but TypeScript is unable to infer this, hence the type assertion.
	let format: Required< FormatDatetime >;
	if ( field.type !== 'datetime' ) {
		format = getFormat( {} as Field< any > );
	} else {
		format = field.format as Required< FormatDatetime >;
	}

	return dateI18n( format.datetime, getDate( value ) );
}

const sort = ( a: any, b: any, direction: SortDirection ) => {
	const timeA = new Date( a ).getTime();
	const timeB = new Date( b ).getTime();

	return direction === 'asc' ? timeA - timeB : timeB - timeA;
};

function getFormat< Item >( field: Field< Item > ): Required< FormatDatetime > {
	const fieldFormat = field.format as FormatDatetime | undefined;
	return {
		datetime:
			fieldFormat?.datetime !== undefined &&
			typeof fieldFormat.datetime === 'string'
				? fieldFormat.datetime
				: getSettings().formats.datetime,
		weekStartsOn:
			fieldFormat?.weekStartsOn !== undefined &&
			DAYS_OF_WEEK.includes( fieldFormat?.weekStartsOn )
				? fieldFormat.weekStartsOn
				: getSettings().l10n.startOfWeek,
	};
}

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
	getFormat,
	validate: {
		required: isValidRequired,
		elements: isValidElements,
	},
} satisfies FieldType< any >;
