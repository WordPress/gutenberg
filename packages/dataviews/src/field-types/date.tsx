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
	DAYS_OF_WEEK,
} from '../constants';
import { getControl } from '../dataform-controls';
import hasElements from './utils/has-elements';
import getValueFromId from './utils/get-value-from-id';
import setValueFromId from './utils/set-value-from-id';
import getFilterBy from './utils/get-filter-by';

function getFormat( field: Field< any > ): Required< FormatDate > {
	return {
		date:
			field.format?.date !== undefined &&
			typeof field.format.date === 'string'
				? field.format.date
				: getSettings().formats.date,
		weekStartsOn:
			field.format?.weekStartsOn !== undefined &&
			DAYS_OF_WEEK.includes( field.format?.weekStartsOn )
				? field.format.weekStartsOn
				: getSettings().l10n.startOfWeek,
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

	// If the field type is date, we've already normalized the format,
	// and so it's safe to tell TypeScript to trust us ("as Required<Format>").
	//
	// There're no runtime paths where this render function is called with a non-date field,
	// but TypeScript is unable to infer this, hence the type assertion.
	let format: Required< FormatDate >;
	if ( field.type !== 'date' ) {
		format = getFormat( field as Field< any > );
	} else {
		format = field.format as Required< FormatDate >;
	}

	return dateI18n( format.date, getDate( value ) );
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

	const sort = ( a: Item, b: Item, direction: SortDirection ) => {
		const valueA = getValue( { item: a } );
		const valueB = getValue( { item: b } );
		const timeA = new Date( valueA ).getTime();
		const timeB = new Date( valueB ).getTime();

		return direction === 'asc' ? timeA - timeB : timeB - timeA;
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
