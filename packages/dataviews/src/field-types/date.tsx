/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	DayString,
	Field,
	FieldTypeDefinition,
	NormalizedFormat,
	SortDirection,
} from '../types';
import RenderFromElements from './utils/render-from-elements';
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
import { DAYS_OF_WEEK, numberToWeekStartsOn } from '../utils/week-starts-on';

function sort( a: any, b: any, direction: SortDirection ) {
	const timeA = new Date( a ).getTime();
	const timeB = new Date( b ).getTime();

	return direction === 'asc' ? timeA - timeB : timeB - timeA;
}

export default {
	sort,
	Edit: 'date',
	isValid: {
		elements: true,
		custom: () => null,
	},
	render: ( { item, field }: DataViewRenderFieldProps< any > ) => {
		if ( field.hasElements ) {
			return <RenderFromElements item={ item } field={ field } />;
		}

		const value = field.getValue( { item } );
		if ( ! value ) {
			return '';
		}

		// Not all fields have format, but date fields do.
		//
		// At runtime, this method will never be called for non-date fields.
		// However, the type system does not know this, so we need to check it.
		// There's an opportunity here to improve the type system.
		if ( field.type !== 'date' ) {
			return '';
		}

		return dateI18n( field.format.date, getDate( value ) );
	},
	enableSorting: true,
	getFormat: ( field: Field< any > ): NormalizedFormat => {
		return {
			date:
				field.format?.date !== undefined &&
				typeof field.format.date === 'string'
					? field.format.date
					: getSettings().formats.date,
			weekStartsOn:
				field.format?.weekStartsOn !== undefined &&
				DAYS_OF_WEEK.includes( field.format?.weekStartsOn as DayString )
					? field.format.weekStartsOn
					: numberToWeekStartsOn( getSettings().l10n.startOfWeek ),
		};
	},
	filterBy: {
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
	},
} satisfies FieldTypeDefinition< any >;
