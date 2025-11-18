/**
 * Internal dependencies
 */
import type { CollectionFontFamily } from '../types';

/**
 * Filters a list of fonts based on the specified filters.
 *
 * This function filters a given array of fonts based on the criteria provided in the filters object.
 * It supports filtering by category and a search term. If the category is provided and not equal to 'all',
 * the function filters the fonts array to include only those fonts that belong to the specified category.
 * Additionally, if a search term is provided, it filters the fonts array to include only those fonts
 * whose name includes the search term, case-insensitively.
 *
 * @param fonts            Array of font objects in font-collection schema fashion to be filtered. Each font object should have a 'categories' property and a 'font_family_settings' property with a 'name' key.
 * @param filters          Object containing the filter criteria. It should have a 'category' key and/or a 'search' key.
 * @param filters.category The category to filter fonts by. If 'all', no category filtering is applied.
 * @param filters.search   The search term to filter fonts by. If provided, only fonts whose
 *
 * @return Array of filtered font objects based on the provided criteria.
 */
export default function filterFonts(
	fonts: CollectionFontFamily[],
	filters: { category?: string; search?: string }
): CollectionFontFamily[] {
	const { category, search } = filters;
	let filteredFonts = fonts || [];

	if ( category && category !== 'all' ) {
		filteredFonts = filteredFonts.filter(
			( font ) =>
				font.categories && font.categories.indexOf( category ) !== -1
		);
	}

	if ( search ) {
		filteredFonts = filteredFonts.filter(
			( font ) =>
				font.font_family_settings &&
				font.font_family_settings.name
					.toLowerCase()
					.includes( search.toLowerCase() )
		);
	}

	return filteredFonts;
}
