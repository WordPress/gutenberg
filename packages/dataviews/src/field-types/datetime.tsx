/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	SortDirection,
	FieldTypeDefinition,
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

function sort( a: any, b: any, direction: SortDirection ) {
	const timeA = new Date( a ).getTime();
	const timeB = new Date( b ).getTime();

	return direction === 'asc' ? timeA - timeB : timeB - timeA;
}

export default {
	sort,
	isValid: {
		elements: true,
		custom: () => null,
	},
	Edit: 'datetime',
	render: ( { item, field }: DataViewRenderFieldProps< any > ) => {
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
	},
	enableSorting: true,
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
	},
} satisfies FieldTypeDefinition< any >;
