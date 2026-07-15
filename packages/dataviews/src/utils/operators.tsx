/**
 * External dependencies
 */
import { subDays, subWeeks, subMonths, subYears } from 'date-fns';

/**
 * WordPress dependencies
 */
import { __, sprintf, type TransformedText } from '@wordpress/i18n';
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { getDate } from '@wordpress/date';
import type { ReactElement, ReactNode } from 'react';

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
};

/**
 * Translation template for a filter-chip prefix. Must contain a `%1$s`
 * placeholder so `sprintf` can substitute the filter name. Mirrors the
 * connectors package's `ConnectorHelpMessage` pattern so that
 * `DistributeSprintfArgs` resolves to `[string]` instead of `[]`.
 */
type FilterTextTemplate =
	| `${ string }%1$s${ string }`
	| TransformedText< `${ string }%1$s${ string }` >;

/**
 * Picks the displayable label for an option, preferring a React node
 * (`labelElement`) when provided so fields like User/Term can render rich
 * markup, otherwise falling back to the plain string `label`.
 *
 * @param option Option to render.
 * @return       React node for display.
 */
function getOptionLabel( option: Option ): ReactNode {
	return option.labelElement ?? option.label;
}

/**
 * Joins multiple options for display. Each value is rendered via
 * `getOptionLabel` so a single React node can be embedded among strings.
 *
 * @param options Options to render.
 * @return        React node with a `,` between each option.
 */
function joinOptionLabels( options: Option[] ): ReactNode {
	return options.map( ( option, index ) => (
		<Fragment key={ index }>
			{ index > 0 && ', ' }
			{ getOptionLabel( option ) }
		</Fragment>
	) );
}

/**
 * Builds the localized prefix portion of a filter chip, e.g. "Author is:".
 * Wraps the filter name in the `<Name>` CSS class and leaves the value
 * portion to the caller.
 *
 * @param filterName Localized filter name (e.g. "Author").
 * @param template   Translation template; must end with a trailing space
 *                   because the value is appended as a JSX child.
 * @return           React element containing the `<Name>`-wrapped prefix.
 */
function renderFilterTextPrefix(
	filterName: string,
	template: FilterTextTemplate
): ReactElement {
	return createInterpolateElement(
		sprintf( template, filterName ),
		filterTextWrappers
	) as ReactElement;
}

/**
 * Composes the full filter chip element: a localized prefix followed by
 * the value content inside the `Value` CSS-class wrapper.
 *
 * @param filterName Localized filter name.
 * @param template   Translation template for the prefix (e.g.
 *                   `<Name>%1$s is: </Name>`).
 * @param value      Value portion rendered as JSX children.
 * @return           React element for the full filter chip.
 */
function renderFilterText(
	filterName: string,
	template: FilterTextTemplate,
	value: ReactNode
): ReactElement {
	return (
		<>
			{ renderFilterTextPrefix( filterName, template ) }
			<span className="dataviews-filters__summary-filter-text-value">
				{ value }
			</span>
		</>
	);
}

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
	/* translators: DataViews operator name */
	label: __( 'Is none of' ),
	filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
		renderFilterText(
			filter.name,
			/* translators: 1: Filter name (e.g. "Author"): "Author is none of:". */
			__( '<Name>%1$s is none of: </Name>' ),
			joinOptionLabels( activeElements )
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
		/* translators: DataViews operator name */
		label: __( 'Includes' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Author"): "Author includes:". */
				__( '<Name>%1$s includes: </Name>' ),
				joinOptionLabels( activeElements )
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
		/* translators: DataViews operator name */
		label: __( 'Includes all' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Author"): "Author includes all:". */
				__( '<Name>%1$s includes all: </Name>' ),
				joinOptionLabels( activeElements )
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
		/* translators: DataViews operator name */
		label: __( 'Between (inc)' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Item count"): "Item count between (inc):". */
				__( '<Name>%1$s between (inc): </Name>' ),
				`${ activeElements[ 0 ].label[ 0 ] } and ${ activeElements[ 0 ].label[ 1 ] }`
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
		/* translators: DataViews operator name */
		label: __( 'In the past' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Date"): "Date is in the past:". */
				__( '<Name>%1$s is in the past: </Name>' ),
				`${ activeElements[ 0 ].value.value } ${ activeElements[ 0 ].value.unit }`
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
		/* translators: DataViews operator name */
		label: __( 'Over' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Date"): "Date is over:". */
				__( '<Name>%1$s is over: </Name>' ),
				`${ activeElements[ 0 ].value.value } ${ activeElements[ 0 ].value.unit }`
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
		/* translators: DataViews operator name */
		label: __( 'Is' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Author"): "Author is:". */
				__( '<Name>%1$s is: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'Is not' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Author"): "Author is not:". */
				__( '<Name>%1$s is not: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
			),
		filter( item, field, filterValue ) {
			return filterValue !== field.getValue( { item } );
		},
		selection: 'single',
	},
	{
		name: OPERATOR_LESS_THAN,
		/* translators: DataViews operator name */
		label: __( 'Less than' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Count"): "Count is less than:". */
				__( '<Name>%1$s is less than: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'Greater than' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Count"): "Count is greater than:". */
				__( '<Name>%1$s is greater than: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'Less than or equal' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Count"): "Count is less than or equal to:". */
				__( '<Name>%1$s is less than or equal to: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'Greater than or equal' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Count"): "Count is greater than or equal to:". */
				__( '<Name>%1$s is greater than or equal to: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'Before' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Date"): "Date is before:". */
				__( '<Name>%1$s is before: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'After' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Date"): "Date is after:". */
				__( '<Name>%1$s is after: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'Before (inc)' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Date"): "Date is on or before:". */
				__( '<Name>%1$s is on or before: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'After (inc)' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Date"): "Date is on or after:". */
				__( '<Name>%1$s is on or after: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'Contains' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Title"): "Title contains:". */
				__( '<Name>%1$s contains: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( "Doesn't contain" ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Title"): "Title doesn't contain:". */
				__( "<Name>%1$s doesn't contain: </Name>" ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'Starts with' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Title"): "Title starts with:". */
				__( '<Name>%1$s starts with: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'On' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Date"): "Date is:". */
				__( '<Name>%1$s is: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
		/* translators: DataViews operator name */
		label: __( 'Not on' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) =>
			renderFilterText(
				filter.name,
				/* translators: 1: Filter name (e.g. "Date"): "Date is not:". */
				__( '<Name>%1$s is not: </Name>' ),
				getOptionLabel( activeElements[ 0 ] )
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
