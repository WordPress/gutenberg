import { OPERATOR_IS, OPERATOR_IS_ANY } from '../../constants';
import type { Option, View } from '../../types';

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
