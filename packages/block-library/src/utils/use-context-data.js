/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Hook to get the current template slug from the editor context.
 * This avoids the @wordpress/editor dependency by accessing the store by string.
 *
 * @return {string|null} The current template slug or null if not available.
 */
export function useTemplateSlug() {
	return useSelect( ( select ) => {
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
}

/**
 * Parse template slug to extract taxonomy and term information.
 *
 * @param {string} templateSlug The template slug to parse.
 * @return {Object} Object containing taxonomy, termSlug, isAuthor, and authorSlug.
 */
export function parseTemplateSlug( templateSlug ) {
	if ( ! templateSlug ) {
		return {
			taxonomy: null,
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		};
	}

	// Check for author patterns
	const authorMatches = templateSlug.match( /^(author)$|^author-(.+)$/ );
	if ( authorMatches ) {
		return {
			taxonomy: null,
			termSlug: null,
			isAuthor: true,
			authorSlug: authorMatches[ 2 ] || null,
		};
	}

	// Check for simple taxonomy patterns, e.g. category, tag
	if ( templateSlug === 'category' ) {
		return {
			taxonomy: 'category',
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		};
	}
	if ( templateSlug === 'tag' ) {
		return {
			taxonomy: 'post_tag',
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		};
	}

	// Check for specific term patterns, e.g. category-news, tag-featured
	if ( templateSlug.startsWith( 'category-' ) ) {
		return {
			taxonomy: 'category',
			termSlug: templateSlug.substring( 9 ),
			isAuthor: false,
			authorSlug: null,
		};
	}
	if ( templateSlug.startsWith( 'tag-' ) ) {
		return {
			taxonomy: 'post_tag',
			termSlug: templateSlug.substring( 4 ),
			isAuthor: false,
			authorSlug: null,
		};
	}

	// Check for taxonomy patterns
	// e.g. taxonomy-product-category, taxonomy-product-category-electronics
	if ( templateSlug.startsWith( 'taxonomy-' ) ) {
		const taxonomyPart = templateSlug.substring( 9 );
		const dashCount = ( taxonomyPart.match( /-/g ) || [] ).length;
		if ( dashCount >= 2 ) {
			const lastDashIndex = taxonomyPart.lastIndexOf( '-' );
			const taxonomy = taxonomyPart.substring( 0, lastDashIndex );
			const termSlug = taxonomyPart.substring( lastDashIndex + 1 );

			return {
				taxonomy,
				termSlug,
				isAuthor: false,
				authorSlug: null,
			};
		}
		return {
			taxonomy: taxonomyPart,
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		};
	}

	return {
		taxonomy: null,
		termSlug: null,
		isAuthor: false,
		authorSlug: null,
	};
}

/**
 * Hook to get term data based on context or template fallback.
 *
 * @param {string|number} termId   The term ID from context
 * @param {string}        taxonomy The taxonomy name from context
 * @return {Object} Object containing term data and context information
 */
export function useTermData( termId, taxonomy ) {
	const templateSlug = useTemplateSlug();
	const { taxonomy: fallbackTaxonomy, termSlug } =
		parseTemplateSlug( templateSlug );

	const hasContext = Boolean( termId && taxonomy );

	// Get term from context
	const contextBasedTerm = useSelect(
		( select ) => {
			if ( ! hasContext ) {
				return null;
			}
			return select( coreStore ).getEntityRecord(
				'taxonomy',
				taxonomy,
				termId
			);
		},
		[ hasContext, taxonomy, termId ]
	);

	// Fallback: Get term from template
	const templateBasedTerm = useSelect(
		( select ) => {
			if ( hasContext || ! fallbackTaxonomy || ! termSlug ) {
				return null;
			}

			const { getEntityRecords } = select( coreStore );
			const termRecords = getEntityRecords(
				'taxonomy',
				fallbackTaxonomy,
				{
					slug: termSlug,
					per_page: 1,
				}
			);

			return termRecords?.[ 0 ] || null;
		},
		[ hasContext, fallbackTaxonomy, termSlug ]
	);

	return {
		hasContext,
		term: hasContext ? contextBasedTerm : templateBasedTerm,
	};
}

/**
 * Hook to get archive label data based on template context.
 *
 * @return {Object} Object containing archive type and name labels
 */
export function useArchiveData() {
	const templateSlug = useTemplateSlug();
	const { taxonomy, termSlug, isAuthor, authorSlug } =
		parseTemplateSlug( templateSlug );

	return useSelect(
		( select ) => {
			const { getEntityRecords, getTaxonomy, getAuthors } =
				select( coreStore );
			let archiveTypeLabel;
			let archiveNameLabel;

			if ( taxonomy ) {
				archiveTypeLabel =
					getTaxonomy( taxonomy )?.labels?.singular_name;
			}

			if ( termSlug ) {
				const records = getEntityRecords( 'taxonomy', taxonomy, {
					slug: termSlug,
					per_page: 1,
				} );
				if ( records?.[ 0 ] ) {
					archiveNameLabel = records[ 0 ].name;
				}
			}

			if ( isAuthor ) {
				archiveTypeLabel = 'Author';
				if ( authorSlug ) {
					const authorRecords = getAuthors( { slug: authorSlug } );
					if ( authorRecords?.[ 0 ] ) {
						archiveNameLabel = authorRecords[ 0 ].name;
					}
				}
			}

			return {
				archiveTypeLabel,
				archiveNameLabel,
			};
		},
		[ taxonomy, termSlug, isAuthor, authorSlug ]
	);
}
