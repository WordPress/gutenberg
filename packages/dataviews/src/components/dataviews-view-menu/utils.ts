import { OPERATOR_IS } from '../../constants';
import type { NormalizedField, NormalizedFilter } from '../../types';

/**
 * The longest list of options a filter can have and still be shown as menu
 * items. Longer lists need searching or scrolling, which a menu does not offer.
 */
export const MAX_MENU_FILTER_ELEMENTS = 8;

/**
 * Whether a filter can be shown in the view menu as a group of radio items.
 *
 * A menu only holds what works as menu items, so a filter is eligible when:
 *
 * - its options are a fixed list (`elements`), not loaded on demand
 *   (`getElements`);
 * - the list is short (at most `MAX_MENU_FILTER_ELEMENTS` options);
 * - it supports choosing exactly one value (the `is` operator);
 * - the user can change it (it is not locked).
 *
 * Everything else (dates, ranges, free text, long or remote lists, filters that
 * only offer other operators) is left to the regular filters UI.
 *
 * @param filter The filter to check.
 * @return Whether the filter is eligible.
 */
export function isMenuFilter( filter: NormalizedFilter ): boolean {
	return (
		! filter.isLocked &&
		typeof filter.getElements !== 'function' &&
		Array.isArray( filter.elements ) &&
		filter.elements.length > 0 &&
		filter.elements.length <= MAX_MENU_FILTER_ELEMENTS &&
		filter.operators.includes( OPERATOR_IS )
	);
}

/**
 * Returns the filters to show in the view menu, in the order their fields were
 * declared.
 *
 * @param filters       The filters available in the view.
 * @param fields        The fields of the view. They set the order.
 * @param excludeFields Ids of fields to leave out, for example a field that is
 *                      already shown as tabs.
 * @return The eligible filters.
 */
export function getMenuFilters(
	filters: NormalizedFilter[],
	fields: NormalizedField< any >[],
	excludeFields: string[] = []
): NormalizedFilter[] {
	const position = new Map(
		fields.map( ( field, index ) => [ field.id, index ] )
	);
	return filters
		.filter(
			( filter ) =>
				! excludeFields.includes( filter.field ) &&
				isMenuFilter( filter )
		)
		.sort(
			( a, b ) =>
				( position.get( a.field ) ?? 0 ) -
				( position.get( b.field ) ?? 0 )
		);
}
