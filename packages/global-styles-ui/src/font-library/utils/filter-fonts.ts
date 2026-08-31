import type { CollectionFontFamily } from '@wordpress/core-data';

/**
 * Variant count range filter values.
 * - '1-3'  : fonts with 1–3 faces (minimal families)
 * - '4-9'  : fonts with 4–9 faces (moderate variety)
 * - '10+'  : fonts with 10 or more faces (extensive families)
 * - ''     : no filter applied (show all)
 */
export type VariantCountRange = '1-3' | '4-9' | '10+' | '';

/**
 * Filters a list of fonts based on the specified filters.
 *
 * This function filters a given array of fonts based on the criteria provided in the filters object.
 * It supports filtering by category, a search term, and number of variants/styles.
 * If the category is provided and not equal to 'all', the function filters the fonts array to include
 * only those fonts that belong to the specified category.
 * Additionally, if a search term is provided, it filters the fonts array to include only those fonts
 * whose name includes the search term, case-insensitively.
 * If a variantCount range is provided, it filters fonts by the number of fontFace entries they define.
 *
 * @param fonts                Array of font objects in font-collection schema fashion to be filtered.
 *                             Each font object should have a 'categories' property and a
 *                             'font_family_settings' property with a 'name' key.
 * @param filters              Object containing the filter criteria.
 * @param filters.category     The category to filter fonts by. If 'all', no category filtering is applied.
 * @param filters.search       The search term to filter fonts by. If provided, only fonts whose name
 *                             includes the term (case-insensitive) are returned.
 * @param filters.variantCount The variant count range to filter by. Ranges correspond to the number
 *                             of fontFace entries: '1-3', '4-9', or '10+'. Empty string disables filter.
 *
 * @return Array of filtered font objects based on the provided criteria.
 */
export default function filterFonts(
	fonts: CollectionFontFamily[],
	filters: {
		category?: string;
		search?: string;
		variantCount?: VariantCountRange;
	}
): CollectionFontFamily[] {
	const { category, search, variantCount } = filters;
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

	if ( variantCount ) {
		filteredFonts = filteredFonts.filter( ( font ) => {
			const count = font.font_family_settings?.fontFace?.length ?? 0;
			switch ( variantCount ) {
				case '1-3':
					return count >= 1 && count <= 3;
				case '4-9':
					return count >= 4 && count <= 9;
				case '10+':
					return count >= 10;
				default:
					return true;
			}
		} );
	}

	return filteredFonts;
}
