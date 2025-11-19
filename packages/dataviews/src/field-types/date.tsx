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
	FormatDate,
	NormalizedField,
	Operator,
	Rules,
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
import { DAYS_OF_WEEK, numberToWeekStartsOn } from './utils/week-starts-on';
import { getControl } from '../dataform-controls';
import hasElements from './utils/has-elements';
import getValueFromId from './utils/get-value-from-id';
import setValueFromId from './utils/set-value-from-id';
import getFilterBy from './utils/get-filter-by';

function sort( a: any, b: any, direction: SortDirection ) {
	const timeA = new Date( a ).getTime();
	const timeB = new Date( b ).getTime();

	return direction === 'asc' ? timeA - timeB : timeB - timeA;
}

function getFormat( field: Field< any > ): Required< FormatDate > {
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
}

function render( { item, field }: DataViewRenderFieldProps< any > ) {
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
}

export default function normalizeField< Item >(
	field: Field< Item >
): NormalizedField< Item > {
	const getValue = field.getValue || getValueFromId( field.id );
	const setValue = field.setValue || setValueFromId( field.id );
	const isValid: Rules< Item > = {
		elements: true,
		custom: () => null,
	};

	const defaultOperators: Operator[] = [
		OPERATOR_ON,
		OPERATOR_NOT_ON,
		OPERATOR_BEFORE,
		OPERATOR_AFTER,
		OPERATOR_BEFORE_INC,
		OPERATOR_AFTER_INC,
		OPERATOR_IN_THE_PAST,
		OPERATOR_OVER,
		OPERATOR_BETWEEN,
	];

	const validOperators: Operator[] = [
		OPERATOR_ON,
		OPERATOR_NOT_ON,
		OPERATOR_BEFORE,
		OPERATOR_AFTER,
		OPERATOR_BEFORE_INC,
		OPERATOR_AFTER_INC,
		OPERATOR_IN_THE_PAST,
		OPERATOR_OVER,
		OPERATOR_BETWEEN,
	];

	return {
		id: field.id,
		type: 'date',
		label: field.label || field.id,
		header: field.header || field.label || field.id,
		description: field.description,
		placeholder: field.placeholder,
		getValue,
		setValue,
		elements: field.elements,
		getElements: field.getElements,
		hasElements: hasElements( field ),
		render: field.render ?? render,
		Edit: getControl( field, 'date' ),
		sort: field.sort ?? sort,
		isValid: {
			...isValid,
			...field.isValid,
		},
		isVisible: field.isVisible,
		enableSorting: field.enableSorting ?? true,
		enableGlobalSearch: field.enableGlobalSearch ?? false,
		enableHiding: field.enableHiding ?? true,
		readOnly: field.readOnly ?? false,
		filterBy: getFilterBy( field, defaultOperators, validOperators ),
		format: getFormat( field ),
	};
}
