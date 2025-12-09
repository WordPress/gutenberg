/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { arrowDown, arrowUp } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { Operator, DayNumber } from './types';

// Filter operators.
export const OPERATOR_IS_ANY = 'isAny';
export const OPERATOR_IS_NONE = 'isNone';
export const OPERATOR_IS_ALL = 'isAll';
export const OPERATOR_IS_NOT_ALL = 'isNotAll';
export const OPERATOR_BETWEEN = 'between';
export const OPERATOR_IN_THE_PAST = 'inThePast';
export const OPERATOR_OVER = 'over';
export const OPERATOR_IS = 'is';
export const OPERATOR_IS_NOT = 'isNot';
export const OPERATOR_LESS_THAN = 'lessThan';
export const OPERATOR_GREATER_THAN = 'greaterThan';
export const OPERATOR_LESS_THAN_OR_EQUAL = 'lessThanOrEqual';
export const OPERATOR_GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual';
export const OPERATOR_BEFORE = 'before';
export const OPERATOR_AFTER = 'after';
export const OPERATOR_BEFORE_INC = 'beforeInc';
export const OPERATOR_AFTER_INC = 'afterInc';
export const OPERATOR_CONTAINS = 'contains';
export const OPERATOR_NOT_CONTAINS = 'notContains';
export const OPERATOR_STARTS_WITH = 'startsWith';
export const OPERATOR_ON = 'on';
export const OPERATOR_NOT_ON = 'notOn';

export const OPERATORS: {
	name: Operator;
	label: string;
	display?: string;
	selection: 'single' | 'multi' | 'custom';
}[] = [
	{
		name: OPERATOR_IS_ANY,
		label: __( 'Includes' ),
		selection: 'multi',
	},
	{
		name: OPERATOR_IS_NONE,
		label: __( 'Is none of' ),
		selection: 'multi',
	},
	{
		name: OPERATOR_IS_ALL,
		label: __( 'Includes all' ),
		selection: 'multi',
	},
	{
		name: OPERATOR_IS_NOT_ALL,
		label: __( 'Is none of' ),
		selection: 'multi',
	},
	{
		name: OPERATOR_BETWEEN,
		label: __( 'Between (inc)' ),
		selection: 'custom',
	},
	{
		name: OPERATOR_IN_THE_PAST,
		label: __( 'In the past' ),
		display: __( 'is in the past' ),
		selection: 'custom',
	},
	{
		name: OPERATOR_OVER,
		label: __( 'Over' ),
		display: __( 'is over' ),
		selection: 'custom',
	},
	{
		name: OPERATOR_IS,
		label: __( 'Is' ),
		selection: 'single',
	},
	{
		name: OPERATOR_IS_NOT,
		label: __( 'Is not' ),
		selection: 'single',
	},
	{
		name: OPERATOR_LESS_THAN,
		label: __( 'Less than' ),
		selection: 'single',
	},
	{
		name: OPERATOR_GREATER_THAN,
		label: __( 'Greater than' ),
		display: __( 'is greater than' ),
		selection: 'single',
	},
	{
		name: OPERATOR_LESS_THAN_OR_EQUAL,
		label: __( 'Less than or equal' ),
		display: __( 'is less than or equal to' ),
		selection: 'single',
	},
	{
		name: OPERATOR_GREATER_THAN_OR_EQUAL,
		label: __( 'Greater than or equal' ),
		display: __( 'is greater than or equal to' ),
		selection: 'single',
	},
	{
		name: OPERATOR_BEFORE,
		label: __( 'Before' ),
		display: __( 'is before' ),
		selection: 'single',
	},
	{
		name: OPERATOR_AFTER,
		label: __( 'After' ),
		display: __( 'is after' ),
		selection: 'single',
	},
	{
		name: OPERATOR_BEFORE_INC,
		label: __( 'Before (inc)' ),
		display: __( 'is on or before' ),
		selection: 'single',
	},
	{
		name: OPERATOR_AFTER_INC,
		label: __( 'After (inc)' ),
		display: __( 'is on or after' ),
		selection: 'single',
	},
	{
		name: OPERATOR_CONTAINS,
		label: __( 'Contains' ),
		selection: 'single',
	},
	{
		name: OPERATOR_NOT_CONTAINS,
		label: __( "Doesn't contain" ),
		selection: 'single',
	},
	{
		name: OPERATOR_STARTS_WITH,
		label: __( 'Starts with' ),
		selection: 'single',
	},
	{
		name: OPERATOR_ON,
		label: __( 'On' ),
		display: __( 'is' ),
		selection: 'single',
	},
	{
		name: OPERATOR_NOT_ON,
		label: __( 'Not on' ),
		display: __( 'is not' ),
		selection: 'single',
	},
];

export const ALL_OPERATOR_NAMES = OPERATORS.map( ( op ) => op.name );
export const SINGLE_SELECTION_OPERATOR_NAMES = OPERATORS.filter(
	( op ) => op.selection === 'single'
).map( ( op ) => op.name );
export const MULTI_SELECTION_OPERATOR_NAMES = OPERATORS.filter(
	( op ) => op.selection === 'multi'
).map( ( op ) => op.name );
export const CUSTOM_SELECTION_OPERATOR_NAMES = OPERATORS.filter(
	( op ) => op.selection === 'custom'
).map( ( op ) => op.name );

export const SORTING_DIRECTIONS = [ 'asc', 'desc' ] as const;
export const sortArrows = { asc: '↑', desc: '↓' };
export const sortValues = { asc: 'ascending', desc: 'descending' } as const;
export const sortLabels = {
	asc: __( 'Sort ascending' ),
	desc: __( 'Sort descending' ),
};
export const sortIcons = {
	asc: arrowUp,
	desc: arrowDown,
};

// View layouts.
export const LAYOUT_TABLE = 'table';
export const LAYOUT_GRID = 'grid';
export const LAYOUT_LIST = 'list';
export const LAYOUT_ACTIVITY = 'activity';

// Picker view layouts.
export const LAYOUT_PICKER_GRID = 'pickerGrid';
export const LAYOUT_PICKER_TABLE = 'pickerTable';

export const DAYS_OF_WEEK: DayNumber[] = [ 0, 1, 2, 3, 4, 5, 6 ];
