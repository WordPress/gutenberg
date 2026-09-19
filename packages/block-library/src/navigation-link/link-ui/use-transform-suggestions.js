import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { transformSuggestions, PREFERRED_COUNT } from './transform-suggestions';

/**
 * Builds the callback that shapes link suggestions for a Navigation Link.
 *
 * An unscoped search merges several requests and keeps only the most relevant
 * of the merged list, so results of the link's own type can be crowded out
 * entirely. Searching "e" on a site with thirteen pages can return twenty
 * suggestions and not one page among them. A second, scoped request runs
 * alongside the first so that the link's own type is always represented.
 *
 * @param {Object} options                          Hook options.
 * @param {string} [options.type]                   The block's type attribute.
 * @param {string} [options.kind]                   The block's kind attribute.
 * @param {Object} [options.preferredSearchOptions] Search options describing the
 *                                                  block's own entity type.
 * @return {Function} A `transformSuggestions` callback for LinkControl.
 */
export function useTransformSuggestions( {
	type,
	kind,
	preferredSearchOptions,
} ) {
	const fetchLinkSuggestions = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				.__experimentalFetchLinkSuggestions,
		[]
	);

	return useCallback(
		async ( suggestions, { isInitialSuggestions, searchTerm } = {} ) => {
			const attributes = { type, kind };

			// Initial suggestions are already scoped to the link's own type,
			// so there is nothing to balance.
			if (
				isInitialSuggestions ||
				! searchTerm ||
				! fetchLinkSuggestions ||
				! preferredSearchOptions
			) {
				return transformSuggestions(
					suggestions,
					attributes,
					searchTerm
				);
			}

			let preferred = [];

			try {
				preferred = await fetchLinkSuggestions( searchTerm, {
					...preferredSearchOptions,
					perPage: PREFERRED_COUNT,
				} );
			} catch {
				// A failed second request should not lose the results that the
				// first one already found.
			}

			return transformSuggestions(
				[ ...preferred, ...suggestions ],
				attributes,
				searchTerm
			);
		},
		[ fetchLinkSuggestions, type, kind, preferredSearchOptions ]
	);
}
