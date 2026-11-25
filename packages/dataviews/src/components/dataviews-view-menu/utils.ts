import getSelectionOperator from '../../utils/get-selection-operator';
import type { NormalizedField, NormalizedFilter } from '../../types';

/**
 * The longest list of options a filter can have and still be shown as menu
 * items. It is the same limit after which the filters UI swaps its plain list
 * of options for a searchable one, which a menu does not offer.
 */
export const MAX_MENU_FILTER_ELEMENTS = 10;

/**
 * How many options the menu shows at once. With more, each group of options
 * moves to its own submenu, so the menu stays short.
 */
export const MAX_INLINE_OPTIONS = 10;

/**
 * Whether a filter can be shown in the view menu as a group of menu items.
 *
 * The menu follows the filter the field already defines, and only holds what
 * works as menu items. A filter is eligible when:
 *
 * - its options are a fixed list (`elements`), not loaded on demand
 *   (`getElements`);
 * - the list is short (at most `MAX_MENU_FILTER_ELEMENTS` options);
 * - it is filtered by picking among those options: one of them (the `is`
 *   operator, shown as radio items) or several (`isAny`, shown as checkboxes);
 * - the user can change it (it is not locked).
 *
 * Everything else (dates, numbers, free text, long or remote lists) needs a
 * control a menu can't hold, and is left to the regular filters UI.
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
		getSelectionOperator( filter ) !== undefined
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
