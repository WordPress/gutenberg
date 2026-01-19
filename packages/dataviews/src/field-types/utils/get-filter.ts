/**
 * Internal dependencies
 */
import {
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
} from '../../constants';
import type { FilterOperator, FilterOperatorMap, Operator } from '../../types';
import type { FieldType } from '../../types/private';
import filterIs from './filter-is';
import filterIsNot from './filter-is-not';
import filterIsAny from './filter-is-any';
import filterIsNone from './filter-is-none';
import filterIsAll from './filter-is-all';
import filterLessThan from './filter-less-than';
import filterGreaterThan from './filter-greater-than';
import filterLessThanOrEqual from './filter-less-than-or-equal';
import filterGreaterThanOrEqual from './filter-greater-than-or-equal';
import filterBefore from './filter-before';
import filterAfter from './filter-after';
import filterBeforeInc from './filter-before-inc';
import filterAfterInc from './filter-after-inc';
import filterContains from './filter-contains';
import filterNotContains from './filter-not-contains';
import filterStartsWith from './filter-starts-with';
import filterBetween from './filter-between';
import filterOn from './filter-on';
import filterNotOn from './filter-not-on';
import filterInThePast from './filter-in-the-past';
import filterOver from './filter-over';

const DEFAULT_FILTER_MAP: Record< Operator, FilterOperator< any > > = {
	[ OPERATOR_IS ]: filterIs,
	[ OPERATOR_IS_NOT ]: filterIsNot,
	[ OPERATOR_IS_ANY ]: filterIsAny,
	[ OPERATOR_IS_NONE ]: filterIsNone,
	[ OPERATOR_IS_ALL ]: filterIsAll,
	[ OPERATOR_IS_NOT_ALL ]: filterIsNone, // Deprecated, same as `isNone`.
	[ OPERATOR_LESS_THAN ]: filterLessThan,
	[ OPERATOR_GREATER_THAN ]: filterGreaterThan,
	[ OPERATOR_LESS_THAN_OR_EQUAL ]: filterLessThanOrEqual,
	[ OPERATOR_GREATER_THAN_OR_EQUAL ]: filterGreaterThanOrEqual,
	[ OPERATOR_BEFORE ]: filterBefore,
	[ OPERATOR_AFTER ]: filterAfter,
	[ OPERATOR_BEFORE_INC ]: filterBeforeInc,
	[ OPERATOR_AFTER_INC ]: filterAfterInc,
	[ OPERATOR_CONTAINS ]: filterContains,
	[ OPERATOR_NOT_CONTAINS ]: filterNotContains,
	[ OPERATOR_STARTS_WITH ]: filterStartsWith,
	[ OPERATOR_BETWEEN ]: filterBetween,
	[ OPERATOR_ON ]: filterOn,
	[ OPERATOR_NOT_ON ]: filterNotOn,
	[ OPERATOR_IN_THE_PAST ]: filterInThePast,
	[ OPERATOR_OVER ]: filterOver,
};

export default function getFilter< Item >(
	fieldType: FieldType< Item >
): FilterOperatorMap< Item > {
	const typeOverrides = fieldType.filter ?? {};
	return fieldType.validOperators.reduce( ( accumulator, operator ) => {
		if ( operator in DEFAULT_FILTER_MAP || operator in typeOverrides ) {
			accumulator[ operator ] =
				typeOverrides[ operator ] ?? DEFAULT_FILTER_MAP[ operator ];
		}
		return accumulator;
	}, {} as FilterOperatorMap< Item > );
}
