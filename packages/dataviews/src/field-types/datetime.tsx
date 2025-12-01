/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	Field,
	NormalizedField,
	Operator,
	Rules,
	SortDirection,
} from '../types';
import RenderFromElements from './utils/render-from-elements';
import parseDateTime from './utils/parse-date-time';
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
import { getControl } from '../dataform-controls';
import hasElements from './utils/has-elements';
import getValueFromId from './utils/get-value-from-id';
import setValueFromId from './utils/set-value-from-id';
import getFilterBy from './utils/get-filter-by';

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	if ( field.elements ) {
		return <RenderFromElements item={ item } field={ field } />;
	}

	const value = field.getValue( { item } );
	if ( [ '', undefined, null ].includes( value ) ) {
		return null;
	}

	try {
		const dateValue = parseDateTime( value );
		return dateValue?.toLocaleString();
	} catch ( error ) {
		return null;
	}
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
	];

	return {
		id: field.id,
		type: 'datetime',
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
		Edit: getControl( field, 'datetime' ),
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
		format: {},
	};
}
