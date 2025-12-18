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
	FormatDate,
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
	OPERATOR_BETWEEN,
	DAYS_OF_WEEK,
} from '../constants';
import isValidRequired from './utils/is-valid-required';

function getFormat< Item >( field: Field< Item > ): Required< FormatDate > {
	const fieldFormat = field.format as FormatDate | undefined;
	return {
		date:
			fieldFormat?.date !== undefined &&
			typeof fieldFormat.date === 'string'
				? fieldFormat.date
				: getSettings().formats.date,
		weekStartsOn:
			fieldFormat?.weekStartsOn !== undefined &&
			DAYS_OF_WEEK.includes( fieldFormat?.weekStartsOn )
				? fieldFormat.weekStartsOn
				: getSettings().l10n.startOfWeek,
	};
}

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	if ( field.hasElements ) {
		return <RenderFromElements item={ item } field={ field } />;
	}

	const value = field.getValue( { item } );
	if ( [ '', undefined, null ].includes( value ) ) {
		return '';
	}

	// If the field type is date, we've already normalized the format,
	// and so it's safe to tell TypeScript to trust us ("as Required<Format>").
	//
	// There're no runtime paths where this render function is called with a non-date field,
	// but TypeScript is unable to infer this, hence the type assertion.
	let format: Required< FormatDate >;
	if ( field.type !== 'date' ) {
		format = getFormat( {} as Field< any > );
	} else {
		format = field.format as Required< FormatDate >;
	}

	return dateI18n( format.date, getDate( value ) );
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
	getFormat,
	validate: {
		required: isValidRequired,
		elements: isValidElements,
	},
} satisfies FieldType< any >;
