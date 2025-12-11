/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import type { ReactElement } from 'react';

/**
 * Internal dependencies
 */
import type { NormalizedFilter, Operator, Option } from '../types';
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

const FilterTextBetween = ( {
	filter,
	operator,
	valueMin,
	valueMax,
}: {
	filter: string;
	operator: string;
	valueMin: string;
	valueMax: string;
} ): ReactElement => {
	return createInterpolateElement(
		sprintf(
			/* translators: 1: Filter name. 2: Operator string. 3: Filter value min. 4: Filter value max. e.g.: "Item count between: 10 and 180". */
			__( '<Name>%1$s %2$s: </Name><Value>%3$s and %4$s</Value>' ),
			filter,
			operator,
			valueMin,
			valueMax
		),
		filterTextWrappers
	);
};

const FilterText = ( {
	filter,
	operator,
	value,
}: {
	filter: string;
	operator: string;
	value: string;
} ): ReactElement => {
	return createInterpolateElement(
		sprintf(
			/* translators: 1: Filter name (e.g. "Author"). 2: Operator string (e.g. "is any"). 3: Filter value (e.g. "Admin"): "Author is any: Admin, Editor". */
			__( '<Name>%1$s %2$s: </Name><Value>%3$s</Value>' ),
			filter,
			operator,
			value
		),
		filterTextWrappers
	);
};

const OPERATORS: {
	name: Operator;
	label: string;
	filterText: (
		filter: NormalizedFilter,
		activeElements: Option[]
	) => ReactElement;
	selection: 'single' | 'multi' | 'custom';
}[] = [
	{
		name: OPERATOR_IS_ANY,
		/* translators: DataViews operator name */
		label: __( 'Includes' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'includes' ) }
				value={ activeElements
					.map( ( element ) => element.label )
					.join( ', ' ) }
			/>
		),
		selection: 'multi',
	},
	{
		name: OPERATOR_IS_NONE,
		/* translators: DataViews operator name */
		label: __( 'Is none of' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is none of' ) }
				value={ activeElements
					.map( ( element ) => element.label )
					.join( ', ' ) }
			/>
		),
		selection: 'multi',
	},
	{
		name: OPERATOR_IS_ALL,
		/* translators: DataViews operator name */
		label: __( 'Includes all' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'includes all' ) }
				value={ activeElements
					.map( ( element ) => element.label )
					.join( ', ' ) }
			/>
		),
		selection: 'multi',
	},
	{
		name: OPERATOR_IS_NOT_ALL,
		/* translators: DataViews operator name */
		label: __( 'Is none of' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is none of' ) }
				value={ activeElements
					.map( ( element ) => element.label )
					.join( ', ' ) }
			/>
		),
		selection: 'multi',
	},
	{
		name: OPERATOR_BETWEEN,
		/* translators: DataViews operator name */
		label: __( 'Between (inc)' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterTextBetween
				filter={ filter.name }
				operator={ __( 'between (inc)' ) }
				valueMin={ activeElements[ 0 ].label[ 0 ] }
				valueMax={ activeElements[ 0 ].label[ 1 ] }
			/>
		),
		selection: 'custom',
	},
	{
		name: OPERATOR_IN_THE_PAST,
		/* translators: DataViews operator name */
		label: __( 'In the past' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is in the past' ) }
				value={ `${ activeElements[ 0 ].value.value } ${ activeElements[ 0 ].value.unit }` }
			/>
		),
		selection: 'custom',
	},
	{
		name: OPERATOR_OVER,
		/* translators: DataViews operator name */
		label: __( 'Over' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is over' ) }
				value={ `${ activeElements[ 0 ].value.value } ${ activeElements[ 0 ].value.unit }` }
			/>
		),
		selection: 'custom',
	},
	{
		name: OPERATOR_IS,
		/* translators: DataViews operator name */
		label: __( 'Is' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_IS_NOT,
		/* translators: DataViews operator name */
		label: __( 'Is not' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is not' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_LESS_THAN,
		/* translators: DataViews operator name */
		label: __( 'Less than' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is less than' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_GREATER_THAN,
		/* translators: DataViews operator name */
		label: __( 'Greater than' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is greater than' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_LESS_THAN_OR_EQUAL,
		/* translators: DataViews operator name */
		label: __( 'Less than or equal' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is less than or equal to' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_GREATER_THAN_OR_EQUAL,
		/* translators: DataViews operator name */
		label: __( 'Greater than or equal' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is greater than or equal to' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_BEFORE,
		/* translators: DataViews operator name */
		label: __( 'Before' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is before' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_AFTER,
		/* translators: DataViews operator name */
		label: __( 'After' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is after' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_BEFORE_INC,
		/* translators: DataViews operator name */
		label: __( 'Before (inc)' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is on or before' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_AFTER_INC,
		/* translators: DataViews operator name */
		label: __( 'After (inc)' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is on or after' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_CONTAINS,
		/* translators: DataViews operator name */
		label: __( 'Contains' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'contains' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_NOT_CONTAINS,
		/* translators: DataViews operator name */
		label: __( "Doesn't contain" ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( "doesn't contain" ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_STARTS_WITH,
		/* translators: DataViews operator name */
		label: __( 'Starts with' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'starts with' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_ON,
		/* translators: DataViews operator name */
		label: __( 'On' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
		selection: 'single',
	},
	{
		name: OPERATOR_NOT_ON,
		/* translators: DataViews operator name */
		label: __( 'Not on' ),
		filterText: ( filter: NormalizedFilter, activeElements: Option[] ) => (
			<FilterText
				filter={ filter.name }
				operator={ __( 'is not' ) }
				value={ activeElements[ 0 ].label }
			/>
		),
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
