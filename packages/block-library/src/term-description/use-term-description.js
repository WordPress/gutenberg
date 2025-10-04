/**
 * WordPress dependencies
 */
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Hook to fetch term description based on context or fallback to template parsing.
 *
 * This hook prioritizes context-provided termId and taxonomy, but falls back to
 * template-based detection when no context is available.
 *
 * @param {string|number} termId   The term ID from context
 * @param {string}        taxonomy The taxonomy name from context
 */
export function useTermDescription( termId, taxonomy ) {
	const [ description, setDescription, fullDescription ] = useEntityProp(
		'taxonomy',
		taxonomy,
		'description',
		termId
	);

	// Fallback approach: Parse template slug when no context is available.
	const templateBasedData = useTemplateBasedTermData();

	const hasContext = Boolean( termId && taxonomy );

	return {
		hasContext,
		setDescription,
		termDescription: hasContext
			? fullDescription?.rendered || description || ''
			: templateBasedData,
	};
}

/**
 * Fallback hook to fetch term data from template context (backward compatibility).
 * This maintains the same logic as the original implementation for cases where
 * no termId/taxonomy context is provided.
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
		// If it's for all taxonomies of a type (e.g., category, tag).
		if ( taxonomyMatches[ 1 ] ) {
			taxonomy = taxonomyMatches[ 2 ]
				? taxonomyMatches[ 2 ]
				: taxonomyMatches[ 1 ];
		}
		// If it's for a specific term (e.g., category-news, tag-featured).
		else if ( taxonomyMatches[ 3 ] ) {
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
				return '';
			}

			const { getEntityRecords } = select( coreStore );

			const termRecords = getEntityRecords( 'taxonomy', taxonomy, {
				slug: termSlug,
				per_page: 1,
			} );

			if ( termRecords && termRecords[ 0 ] ) {
				return termRecords[ 0 ].description || '';
			}

			return '';
		},
		[ taxonomy, termSlug ]
	);
}
