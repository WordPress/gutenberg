export const filterOutDuplicatesByName = ( currentItem, index, items ) =>
	index === items.findIndex( ( item ) => currentItem.name === item.name );

/**
 * Returns whether a pattern belongs to "Other categories": it comes from an
 * installed theme other than the active one, and only uses categories that
 * theme registers. Those categories are only registered while the theme is
 * active.
 *
 * @param {Object} pattern    The pattern.
 * @param {Array}  categories The registered pattern categories.
 *
 * @return {boolean} Whether the pattern belongs to "Other categories".
 */
export const isInOtherCategories = ( pattern, categories ) =>
	!! pattern.theme &&
	!! pattern.categories?.length &&
	! pattern.categories.some( ( name ) =>
		categories.some( ( category ) => category.name === name )
	);
