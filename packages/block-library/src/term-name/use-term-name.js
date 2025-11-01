/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Hook to fetch term name based on context or fallback to template parsing.
 *
 * This hook prioritizes context-provided termId and taxonomy, but falls back to
 * template-based detection when no context is available.
 *
 * @param {string|number} termId   The term ID from context
 * @param {string}        taxonomy The taxonomy name from context
 */
export function useTermName( termId, taxonomy ) {
	// Get term from context if available.
	const contextBasedTerm = useSelect(
		( select ) => {
			if ( ! termId || ! taxonomy ) {
				return null;
			}
			return select( coreStore ).getEntityRecord(
				'taxonomy',
				taxonomy,
				termId
			);
		},
		[ termId, taxonomy ]
	);

	// Fallback approach: Parse template slug when no context is available.
	const templateBasedTerm = useTemplateBasedTermData();
	const hasContext = Boolean( termId && taxonomy );

	return {
		hasContext,
		term: hasContext ? contextBasedTerm : templateBasedTerm,
	};
}

/**
 * Fallback hook to fetch term data from template context.
 * Parses the template slug to determine if we're on a specific term archive.
 */
function useTemplateBasedTermData() {
	const templateSlug = useSelect( ( select ) => {
		// Access core/editor by string to avoid @wordpress/editor dependency.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const { getCurrentPostId, getCurrentPostType, getCurrentTemplateId } =
			select( 'core/editor' );
		const currentPostType = getCurrentPostType();
		const templateId =
			getCurrentTemplateId() ||
			( currentPostType === 'wp_template' ? getCurrentPostId() : null );

		return templateId
			? select( coreStore ).getEditedEntityRecord(
					'postType',
					'wp_template',
					templateId
			  )?.slug
			: null;
	}, [] );

	const taxonomyMatches = templateSlug?.match(
		/^(category|tag|taxonomy-([^-]+))$|^(((category|tag)|taxonomy-([^-]+))-(.+))$/
	);

	let taxonomy;
	let termSlug;

	if ( taxonomyMatches ) {
		// If it's for a specific term (e.g., category-news, tag-featured).
		if ( taxonomyMatches[ 3 ] ) {
			taxonomy = taxonomyMatches[ 6 ]
				? taxonomyMatches[ 6 ]
				: taxonomyMatches[ 4 ];
			termSlug = taxonomyMatches[ 7 ];
		}

		taxonomy = taxonomy === 'tag' ? 'post_tag' : taxonomy;
	}

	return useSelect(
		( select ) => {
			if ( ! taxonomy || ! termSlug ) {
				return null;
			}

			const { getEntityRecords } = select( coreStore );

			const termRecords = getEntityRecords( 'taxonomy', taxonomy, {
				slug: termSlug,
				per_page: 1,
			} );

			if ( termRecords && termRecords[ 0 ] ) {
				return termRecords[ 0 ];
			}

			return null;
		},
		[ taxonomy, termSlug ]
	);
}
