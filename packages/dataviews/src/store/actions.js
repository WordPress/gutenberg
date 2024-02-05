/**
 * Sets the filter's field to open on mount.
 *
 * @param {?string} filterField The filter's field.
 * @return {Object} Action object.
 */
export function setOpenFilterOnMount( filterField ) {
	return {
		type: 'SET_OPEN_FILTER_ON_MOUNT',
		filterField,
	};
}
