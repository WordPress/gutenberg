import { OPERATOR_IS, OPERATOR_IS_ANY } from '../../constants';
import type { NormalizedFilter, Operator, Option, View } from '../../types';

/**
 * Returns the operator the tabs filter with: `is` when the field holds one
 * value, or `isAny` when it holds a list of values (an item matches when the
 * list contains the tab's value). Fields that support neither can't be shown
 * as tabs.
 *
 * @param filter The filter of the field shown as tabs.
 * @return The operator, or `undefined` when the field can't be shown as tabs.
 */
export function getFilterTabsOperator(
	filter: NormalizedFilter
): Operator | undefined {
	if ( filter.operators.includes( OPERATOR_IS ) ) {
		return OPERATOR_IS;
	}
	if ( filter.operators.includes( OPERATOR_IS_ANY ) ) {
		return OPERATOR_IS_ANY;
	}
	return undefined;
}

/**
 * Returns which option the view currently filters the field by.
 *
 * @param view     The current view.
 * @param field    The id of the field shown as tabs.
 * @param elements The options of the field.
 * @return The index of the option; `'all'` when the field isn't filtered; or
 *         `null` when the field is filtered in a way a single tab can't show
 *         (several values, another operator, or a value that isn't an option).
 */
export function getActiveOption(
	view: View,
	field: string,
	elements: Option[]
): number | 'all' | null {
	const fieldFilters = ( view.filters ?? [] ).filter(
		( filter ) => filter.field === field
	);
	if ( fieldFilters.length === 0 ) {
		return 'all';
	}
	if ( fieldFilters.length > 1 ) {
		return null;
	}

	const { operator, value } = fieldFilters[ 0 ];
	if (
		value === undefined ||
		( Array.isArray( value ) && value.length === 0 )
	) {
		return 'all';
	}

	let activeValue;
	if ( operator === OPERATOR_IS ) {
		activeValue = value;
	} else if (
		operator === OPERATOR_IS_ANY &&
		Array.isArray( value ) &&
		value.length === 1
	) {
		activeValue = value[ 0 ];
	} else {
		return null;
	}

	const index = elements.findIndex(
		( element ) => element.value === activeValue
	);
	return index === -1 ? null : index;
}
