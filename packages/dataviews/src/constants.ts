import { __ } from '@wordpress/i18n';
import { arrowDown, arrowUp } from '@wordpress/icons';
import type { DayNumber } from './types';

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
export const LAYOUT_PICKER_ACTIVITY = 'pickerActivity';

export const DAYS_OF_WEEK: DayNumber[] = [ 0, 1, 2, 3, 4, 5, 6 ];

// The preset aspect ratios available for item media previews. Source of
// truth for the `MediaAspectRatio` type (derived from this array), and used
// by layouts to validate the configured `layout.aspectRatio` before
// applying it.
export const MEDIA_ASPECT_RATIOS = [
	'1/1',
	'4/3',
	'3/4',
	'3/2',
	'2/3',
	'16/9',
	'9/16',
] as const;
