import getSelectionOperator from '../../utils/get-selection-operator';
import type { NormalizedField, NormalizedFilter } from '../../types';

/**
 * How many options the menu shows at once. With more, each group of options
 * moves to its own submenu, so the menu stays short. A group on its own stays
 * in the menu however long it is.
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
 * - it is filtered by picking among those options: one of them (the `is`
 *   operator, shown as radio items) or several (`isAny`, shown as checkboxes);
 * - the user can change it (it is not locked).
 *
 * The length of the list doesn't count. A list is often open to extension (the
 * sources or categories that plugins register, for example), and a filter
 * that left the menu once its list grew past some size would leave the user
 * with no way to change it. A long list moves to a submenu, which scrolls.
 *
 * Everything else (dates, numbers, free text, remote lists) needs a control a
 * menu can't hold, and is left to the regular filters UI.
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
