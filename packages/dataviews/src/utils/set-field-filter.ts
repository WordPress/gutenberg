import type { Filter, View } from '../types';

/**
 * Returns a copy of the view where the given field is filtered by a single
 * filter, or by none. Any previous filter for that field is replaced, and the
 * view goes back to the first page.
 *
 * @param view   The current view.
 * @param field  The id of the field to filter by.
 * @param filter The operator and value to filter by. Leave it out to remove
 *               the field's filter.
 * @return The updated view.
 */
export default function setFieldFilter< T extends View >(
	view: T,
	field: string,
	filter?: Pick< Filter, 'operator' | 'value' >
): T {
	const otherFilters = ( view.filters ?? [] ).filter(
		( viewFilter ) => viewFilter.field !== field
	);
	return {
		...view,
		page: 1,
		filters: filter
			? [
					...otherFilters,
					{ field, operator: filter.operator, value: filter.value },
				]
			: otherFilters,
	};
}
