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
export const OPERATOR_IS = 'is';
export const OPERATOR_IS_NOT = 'isNot';
export const OPERATOR_IS_ANY = 'isAny';
export const OPERATOR_IS_NONE = 'isNone';
export const OPERATOR_IS_ALL = 'isAll';
export const OPERATOR_IS_NOT_ALL = 'isNotAll';
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
export const OPERATOR_BETWEEN = 'between';
export const OPERATOR_ON = 'on';
export const OPERATOR_NOT_ON = 'notOn';
export const OPERATOR_IN_THE_PAST = 'inThePast';
export const OPERATOR_OVER = 'over';

export const ALL_OPERATORS: Operator[] = [
	OPERATOR_IS,
	OPERATOR_IS_NOT,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_ALL,
	OPERATOR_IS_NOT_ALL,
	OPERATOR_LESS_THAN,
	OPERATOR_GREATER_THAN,
	OPERATOR_LESS_THAN_OR_EQUAL,
	OPERATOR_GREATER_THAN_OR_EQUAL,
	OPERATOR_BEFORE,
	OPERATOR_AFTER,
	OPERATOR_BEFORE_INC,
	OPERATOR_AFTER_INC,
	OPERATOR_CONTAINS,
	OPERATOR_NOT_CONTAINS,
	OPERATOR_STARTS_WITH,
	OPERATOR_BETWEEN,
	OPERATOR_ON,
	OPERATOR_NOT_ON,
	OPERATOR_IN_THE_PAST,
	OPERATOR_OVER,
];

export const SINGLE_SELECTION_OPERATORS: Operator[] = [
	OPERATOR_IS,
	OPERATOR_IS_NOT,
	OPERATOR_LESS_THAN,
	OPERATOR_GREATER_THAN,
	OPERATOR_LESS_THAN_OR_EQUAL,
	OPERATOR_GREATER_THAN_OR_EQUAL,
	OPERATOR_BEFORE,
	OPERATOR_AFTER,
	OPERATOR_BEFORE_INC,
	OPERATOR_AFTER_INC,
	OPERATOR_CONTAINS,
	OPERATOR_NOT_CONTAINS,
	OPERATOR_STARTS_WITH,
	OPERATOR_ON,
	OPERATOR_NOT_ON,
];

export const OPERATORS: Record<
	Operator,
	{ label: string; display?: string }
> = {
	[ OPERATOR_IS ]: {
		label: __( 'Is' ),
	},
	[ OPERATOR_IS_NOT ]: {
		label: __( 'Is not' ),
	},
	[ OPERATOR_IS_ANY ]: {
		label: __( 'Includes' ),
	},
	[ OPERATOR_IS_NONE ]: {
		label: __( 'Is none of' ),
	},
	[ OPERATOR_IS_ALL ]: {
		label: __( 'Includes all' ),
	},
	[ OPERATOR_IS_NOT_ALL ]: {
		label: __( 'Is none of' ),
	},
	[ OPERATOR_LESS_THAN ]: {
		label: __( 'Less than' ),
	},
	[ OPERATOR_GREATER_THAN ]: {
		label: __( 'Greater than' ),
		display: __( 'is greater than' ),
	},
	[ OPERATOR_LESS_THAN_OR_EQUAL ]: {
		label: __( 'Less than or equal' ),
		display: __( 'is less than or equal to' ),
	},
	[ OPERATOR_GREATER_THAN_OR_EQUAL ]: {
		label: __( 'Greater than or equal' ),
		display: __( 'is greater than or equal to' ),
	},
	[ OPERATOR_BEFORE ]: {
		label: __( 'Before' ),
		display: __( 'is before' ),
	},
	[ OPERATOR_AFTER ]: {
		label: __( 'After' ),
		display: __( 'is after' ),
	},
	[ OPERATOR_BEFORE_INC ]: {
		label: __( 'Before (inc)' ),
		display: __( 'is on or before' ),
	},
	[ OPERATOR_AFTER_INC ]: {
		label: __( 'After (inc)' ),
		display: __( 'is on or after' ),
	},
	[ OPERATOR_CONTAINS ]: {
		label: __( 'Contains' ),
	},
	[ OPERATOR_NOT_CONTAINS ]: {
		label: __( "Doesn't contain" ),
	},
	[ OPERATOR_STARTS_WITH ]: {
		label: __( 'Starts with' ),
	},
	[ OPERATOR_BETWEEN ]: {
		label: __( 'Between (inc)' ),
	},
	[ OPERATOR_ON ]: {
		label: __( 'On' ),
		display: __( 'is' ),
	},
	[ OPERATOR_NOT_ON ]: {
		label: __( 'Not on' ),
		display: __( 'is not' ),
	},
	[ OPERATOR_IN_THE_PAST ]: {
		label: __( 'In the past' ),
		display: __( 'is in the past' ),
	},
	[ OPERATOR_OVER ]: {
		label: __( 'Over' ),
		display: __( 'is over' ),
	},
};

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
