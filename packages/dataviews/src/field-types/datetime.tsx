/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	Field,
	Operator,
	Rules,
	SortDirection,
} from '../types';
import type { TypeProvidedProps } from '../types/private';
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
import getValueFromId from './utils/get-value-from-id';
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

const isValid: Rules< any > = {
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

export default function normalizeField< Item >(
	field: Field< Item >
): TypeProvidedProps< Item > {
	const getValue = field.getValue || getValueFromId( field.id );

	const sort = ( a: Item, b: Item, direction: SortDirection ) => {
		const valueA = getValue( { item: a } );
		const valueB = getValue( { item: b } );
		const timeA = new Date( valueA ).getTime();
		const timeB = new Date( valueB ).getTime();

		return direction === 'asc' ? timeA - timeB : timeB - timeA;
	};

	return {
		type: 'datetime',
		render: field.render ?? render,
		Edit: getControl( field, 'datetime' ),
		sort: field.sort ?? sort,
		isValid: {
			...isValid,
			...field.isValid,
		},
		enableSorting: field.enableSorting ?? true,
		enableGlobalSearch: field.enableGlobalSearch ?? false,
		filterBy: getFilterBy( field, defaultOperators, validOperators ),
		format: {},
	};
}
