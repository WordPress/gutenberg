/**
 * External dependencies
 */
import { subDays, subWeeks, subMonths, subYears } from 'date-fns';

/**
 * WordPress dependencies
 */
import { sprintf } from '@wordpress/i18n';
import i18n from '@wordpress/dataviews-i18n';
import { createInterpolateElement } from '@wordpress/element';
import { getDate } from '@wordpress/date';
import type { ReactElement } from 'react';

/**
 * Internal dependencies
 */
import type {
	FilterOperator,
	NormalizedFilter,
	Operator,
	Option,
} from '../types';
import {
	OPERATOR_AFTER,
	OPERATOR_AFTER_INC,
	OPERATOR_BEFORE,
	OPERATOR_BEFORE_INC,
	OPERATOR_BETWEEN,
	OPERATOR_CONTAINS,
	OPERATOR_GREATER_THAN,
	OPERATOR_GREATER_THAN_OR_EQUAL,
	OPERATOR_IN_THE_PAST,
	OPERATOR_IS,
	OPERATOR_IS_ALL,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_NOT,
	OPERATOR_IS_NOT_ALL,
	OPERATOR_LESS_THAN,
	OPERATOR_LESS_THAN_OR_EQUAL,
	OPERATOR_NOT_CONTAINS,
	OPERATOR_NOT_ON,
	OPERATOR_ON,
	OPERATOR_OVER,
	OPERATOR_STARTS_WITH,
} from '../constants';

const filterTextWrappers = {
	Name: <span className="dataviews-filters__summary-filter-text-name" />,
	Value: <span className="dataviews-filters__summary-filter-text-value" />,
};

/**
 * Calculates a date offset from now.
 *
 * @param value Number of units to offset.
 * @param unit  Unit of time to offset (days, weeks, months, years).
 * @return      Date offset from now.
 */
function getRelativeDate( value: number, unit: string ): Date {
	switch ( unit ) {
		case 'days':
			return subDays( new Date(), value );
		case 'weeks':
			return subWeeks( new Date(), value );
		case 'months':
			return subMonths( new Date(), value );
		case 'years':
			return subYears( new Date(), value );
		default:
			return new Date();
	}
}

// Shared operator definition for IS_NONE and IS_NOT_ALL (deprecated).
const isNoneOperatorDefinition = {
	label: i18n.OPERATOR_IS_NONE_OF(),
	filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
		createInterpolateElement(
			sprintf(
				i18n.FILTER_SUMMARY_IS_NONE_OF(),
				filter.name,
				activeElements.map( ( element ) => element.label ).join( ', ' )
			),
			filterTextWrappers
		),
	filter: ( ( item, field, filterValue ) => {
		if ( ! filterValue?.length ) {
			return true;
		}

		const fieldValue = field.getValue( { item } );

		if ( Array.isArray( fieldValue ) ) {
			return ! filterValue.some( ( fv: any ) =>
				fieldValue.includes( fv )
			);
		} else if ( typeof fieldValue === 'string' ) {
			return ! filterValue.includes( fieldValue );
		}

		return false;
	} ) as FilterOperator< any >,
	selection: 'multi' as const,
};

const OPERATORS: {
	name: Operator;
	label: string;
	filterText: (
		filter: NormalizedFilter,
		activeElements: Option[]
	) => ReactElement;
	filter?: FilterOperator< any >;
	selection: 'single' | 'multi' | 'custom';
}[] = [
	{
		name: OPERATOR_IS_ANY,
		label: i18n.OPERATOR_INCLUDES(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_INCLUDES(),
					filter.name,
					activeElements
						.map( ( element ) => element.label )
						.join( ', ' )
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( ! filterValue?.length ) {
				return true;
			}
			const fieldValue = field.getValue( { item } );

			if ( Array.isArray( fieldValue ) ) {
				return filterValue.some( ( fv: any ) =>
					fieldValue.includes( fv )
				);
			} else if ( typeof fieldValue === 'string' ) {
				return filterValue.includes( fieldValue );
			}

			return false;
		},
		selection: 'multi',
	},
	{
		name: OPERATOR_IS_NONE,
		...isNoneOperatorDefinition,
	},
	{
		name: OPERATOR_IS_ALL,
		label: i18n.OPERATOR_INCLUDES_ALL(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_INCLUDES_ALL(),
					filter.name,
					activeElements
						.map( ( element ) => element.label )
						.join( ', ' )
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( ! filterValue?.length ) {
				return true;
			}

			return filterValue.every( ( value: any ) => {
				return field.getValue( { item } )?.includes( value );
			} );
		},
		selection: 'multi',
	},
	{
		name: OPERATOR_IS_NOT_ALL,
		...isNoneOperatorDefinition,
	},
	{
		name: OPERATOR_BETWEEN,
		label: i18n.OPERATOR_BETWEEN_INC(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_BETWEEN_INC(),
					filter.name,
					activeElements[ 0 ].label[ 0 ],
					activeElements[ 0 ].label[ 1 ]
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if (
				! Array.isArray( filterValue ) ||
				filterValue.length !== 2 ||
				filterValue[ 0 ] === undefined ||
				filterValue[ 1 ] === undefined
			) {
				return true;
			}

			const fieldValue = field.getValue( { item } );

			if (
				typeof fieldValue === 'number' ||
				fieldValue instanceof Date ||
				typeof fieldValue === 'string'
			) {
				return (
					fieldValue >= filterValue[ 0 ] &&
					fieldValue <= filterValue[ 1 ]
				);
			}

			return false;
		},
		selection: 'custom',
	},
	{
		name: OPERATOR_IN_THE_PAST,
		label: i18n.OPERATOR_IN_THE_PAST(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_IN_THE_PAST(),
					filter.name,
					`${ activeElements[ 0 ].value.value } ${ activeElements[ 0 ].value.unit }`
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if (
				filterValue?.value === undefined ||
				filterValue?.unit === undefined
			) {
				return true;
			}

			const targetDate = getRelativeDate(
				filterValue.value,
				filterValue.unit
			);
			const fieldValue = getDate( field.getValue( { item } ) );

			return fieldValue >= targetDate && fieldValue <= new Date();
		},
		selection: 'custom',
	},
	{
		name: OPERATOR_OVER,
		label: i18n.OPERATOR_OVER(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_OVER(),
					filter.name,
					`${ activeElements[ 0 ].value.value } ${ activeElements[ 0 ].value.unit }`
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if (
				filterValue?.value === undefined ||
				filterValue?.unit === undefined
			) {
				return true;
			}

			const targetDate = getRelativeDate(
				filterValue.value,
				filterValue.unit
			);
			const fieldValue = getDate( field.getValue( { item } ) );

			return fieldValue < targetDate;
		},
		selection: 'custom',
	},
	{
		name: OPERATOR_IS,
		label: i18n.OPERATOR_IS(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_IS(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			return (
				filterValue === field.getValue( { item } ) ||
				filterValue === undefined
			);
		},
		selection: 'single',
	},
	{
		name: OPERATOR_IS_NOT,
		label: i18n.OPERATOR_IS_NOT(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_IS_NOT(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			return filterValue !== field.getValue( { item } );
		},
		selection: 'single',
	},
	{
		name: OPERATOR_LESS_THAN,
		label: i18n.OPERATOR_LESS_THAN(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_LESS_THAN(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const fieldValue = field.getValue( { item } );

			return fieldValue < filterValue;
		},
		selection: 'single',
	},
	{
		name: OPERATOR_GREATER_THAN,
		label: i18n.OPERATOR_GREATER_THAN(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_GREATER_THAN(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const fieldValue = field.getValue( { item } );

			return fieldValue > filterValue;
		},
		selection: 'single',
	},
	{
		name: OPERATOR_LESS_THAN_OR_EQUAL,
		label: i18n.OPERATOR_LESS_THAN_OR_EQUAL(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_LESS_THAN_OR_EQUAL(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const fieldValue = field.getValue( { item } );

			return fieldValue <= filterValue;
		},
		selection: 'single',
	},
	{
		name: OPERATOR_GREATER_THAN_OR_EQUAL,
		label: i18n.OPERATOR_GREATER_THAN_OR_EQUAL(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_GREATER_THAN_OR_EQUAL(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const fieldValue = field.getValue( { item } );

			return fieldValue >= filterValue;
		},
		selection: 'single',
	},
	{
		name: OPERATOR_BEFORE,
		label: i18n.OPERATOR_BEFORE(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_BEFORE(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const filterDate = getDate( filterValue );
			const fieldDate = getDate( field.getValue( { item } ) );

			return fieldDate < filterDate;
		},
		selection: 'single',
	},
	{
		name: OPERATOR_AFTER,
		label: i18n.OPERATOR_AFTER(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_AFTER(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const filterDate = getDate( filterValue );
			const fieldDate = getDate( field.getValue( { item } ) );

			return fieldDate > filterDate;
		},
		selection: 'single',
	},
	{
		name: OPERATOR_BEFORE_INC,
		label: i18n.OPERATOR_BEFORE_INC(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_ON_OR_BEFORE(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const filterDate = getDate( filterValue );
			const fieldDate = getDate( field.getValue( { item } ) );

			return fieldDate <= filterDate;
		},
		selection: 'single',
	},
	{
		name: OPERATOR_AFTER_INC,
		label: i18n.OPERATOR_AFTER_INC(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_ON_OR_AFTER(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const filterDate = getDate( filterValue );
			const fieldDate = getDate( field.getValue( { item } ) );

			return fieldDate >= filterDate;
		},
		selection: 'single',
	},
	{
		name: OPERATOR_CONTAINS,
		label: i18n.OPERATOR_CONTAINS(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_CONTAINS(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const fieldValue = field.getValue( { item } );

			return (
				typeof fieldValue === 'string' &&
				filterValue &&
				fieldValue
					.toLowerCase()
					.includes( String( filterValue ).toLowerCase() )
			);
		},
		selection: 'single',
	},
	{
		name: OPERATOR_NOT_CONTAINS,
		label: i18n.OPERATOR_DOESNT_CONTAIN(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_DOESNT_CONTAIN(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const fieldValue = field.getValue( { item } );

			return (
				typeof fieldValue === 'string' &&
				filterValue &&
				! fieldValue
					.toLowerCase()
					.includes( String( filterValue ).toLowerCase() )
			);
		},
		selection: 'single',
	},
	{
		name: OPERATOR_STARTS_WITH,
		label: i18n.OPERATOR_STARTS_WITH(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_STARTS_WITH(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const fieldValue = field.getValue( { item } );

			return (
				typeof fieldValue === 'string' &&
				filterValue &&
				fieldValue
					.toLowerCase()
					.startsWith( String( filterValue ).toLowerCase() )
			);
		},
		selection: 'single',
	},
	{
		name: OPERATOR_ON,
		label: i18n.OPERATOR_ON(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_IS(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const filterDate = getDate( filterValue );
			const fieldDate = getDate( field.getValue( { item } ) );

			return filterDate.getTime() === fieldDate.getTime();
		},
		selection: 'single',
	},
	{
		name: OPERATOR_NOT_ON,
		label: i18n.OPERATOR_NOT_ON(),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			createInterpolateElement(
				sprintf(
					i18n.FILTER_SUMMARY_IS_NOT(),
					filter.name,
					activeElements[ 0 ].label
				),
				filterTextWrappers
			),
		filter( item, field, filterValue ) {
			if ( filterValue === undefined ) {
				return true;
			}

			const filterDate = getDate( filterValue );
			const fieldDate = getDate( field.getValue( { item } ) );

			return filterDate.getTime() !== fieldDate.getTime();
		},
		selection: 'single',
	},
];

const getOperatorByName = ( name: string | undefined ) =>
	OPERATORS.find( ( op ) => op.name === name );

const getAllOperatorNames = () => OPERATORS.map( ( op ) => op.name );

const isSingleSelectionOperator = ( name: string ) =>
	OPERATORS.filter( ( op ) => op.selection === 'single' ).some(
		( op ) => op.name === name
	);

const isRegisteredOperator = ( name: string ) =>
	OPERATORS.some( ( op ) => op.name === name );

export {
	getOperatorByName,
	getAllOperatorNames,
	isSingleSelectionOperator,
	isRegisteredOperator,
};
