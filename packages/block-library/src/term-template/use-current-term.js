/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Hook to get the current term from template context.
 * This is used when blocks need to inherit from the current taxonomy template.
 *
 * @param {boolean} inherit Whether to inherit from current context.
 * @return {Object|null} The current term object or null.
 */
export function useCurrentTerm( inherit ) {
	return useSelect(
		( select ) => {
			if ( ! inherit ) {
				return null;
			}

			// Access core/editor by string to avoid @wordpress/editor dependency.
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			const {
				getCurrentPostId,
				getCurrentPostType,
				getCurrentTemplateId,
			} = select( 'core/editor' );
			const currentPostType = getCurrentPostType();
			const templateId =
				getCurrentTemplateId() ||
				( currentPostType === 'wp_template'
					? getCurrentPostId()
					: null );
			const templateSlug = templateId
				? select( coreStore ).getEditedEntityRecord(
						'postType',
						'wp_template',
						templateId
				  )?.slug
				: null;

			if ( ! templateSlug ) {
				return null;
			}

			const taxonomyMatches = templateSlug.match(
				/^(category|tag|taxonomy-([^-]+))$|^(((category|tag)|taxonomy-([^-]+))-(.+))$/
			);

			if ( ! taxonomyMatches ) {
				return null;
			}

			let currentTaxonomy;
			let termSlug;

			// If it's for all taxonomies of a type (e.g., category, tag).
			if ( taxonomyMatches[ 1 ] ) {
				currentTaxonomy = taxonomyMatches[ 2 ]
					? taxonomyMatches[ 2 ]
					: taxonomyMatches[ 1 ];
			}
			// If it's for a specific term (e.g., category-news, tag-featured).
			else if ( taxonomyMatches[ 3 ] ) {
				currentTaxonomy = taxonomyMatches[ 6 ]
					? taxonomyMatches[ 6 ]
					: taxonomyMatches[ 4 ];
				termSlug = taxonomyMatches[ 7 ];
			}

			if ( ! currentTaxonomy || ! termSlug ) {
				return null;
			}

			currentTaxonomy =
				currentTaxonomy === 'tag' ? 'post_tag' : currentTaxonomy;

			const { getEntityRecords } = select( coreStore );
			const termRecords = getEntityRecords( 'taxonomy', currentTaxonomy, {
				slug: termSlug,
				per_page: 1,
			} );

			return termRecords && termRecords[ 0 ] ? termRecords[ 0 ] : null;
		},
		[ inherit ]
	);
}
