/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

const DEFAULT_CONTEXT = {
	taxonomy: null,
	termSlug: null,
	isAuthor: false,
	authorSlug: null,
};

/**
 * Hook to get the current template slug from the editor context.
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
		return DEFAULT_CONTEXT;
	}

	// Check for author patterns
	// e.g. author, author-john-doe
	const authorMatches = templateSlug.match( /^(author)$|^author-(.+)$/ );
	if ( authorMatches ) {
		return {
			...DEFAULT_CONTEXT,
			isAuthor: true,
			authorSlug: authorMatches[ 2 ] || null,
		};
	}

	// Check for taxonomy patterns
	// e.g. taxonomy-product-category, taxonomy-product-category-electronics
	if ( templateSlug.startsWith( 'taxonomy-' ) ) {
		const taxonomyPart = templateSlug.substring( 9 );
		const taxonomyParts = taxonomyPart.split( '-' );

		if ( taxonomyParts.length === 1 ) {
			// No dashes, so the entire part is the taxonomy
			// e.g. taxonomy-product -> taxonomy: "product", term: null
			return {
				...DEFAULT_CONTEXT,
				taxonomy: taxonomyPart,
			};
		}

		if ( taxonomyParts.length === 2 ) {
			// Single dash
			// e.g. taxonomy-product-category -> taxonomy: "product-category", term: null
			return {
				...DEFAULT_CONTEXT,
				taxonomy: taxonomyPart,
			};
		}

		// Multiple dashes
		// e.g. taxonomy-product-category-electronics -> taxonomy: "product-category", term: "electronics"
		const taxonomy = taxonomyParts.slice( 0, -1 ).join( '-' );
		const termSlug = taxonomyParts[ taxonomyParts.length - 1 ];

		return {
			...DEFAULT_CONTEXT,
			taxonomy,
			termSlug,
		};
	}

	// Check for built-in taxonomy patterns
	// e.g. category, tag
	if ( templateSlug === 'category' ) {
		return {
			...DEFAULT_CONTEXT,
			taxonomy: 'category',
		};
	}
	if ( templateSlug === 'tag' ) {
		return {
			...DEFAULT_CONTEXT,
			taxonomy: 'post_tag',
		};
	}

	// Check for specific term patterns for built-in taxonomies
	// e.g. category-news, tag-featured
	if ( templateSlug.startsWith( 'category-' ) ) {
		return {
			...DEFAULT_CONTEXT,
			taxonomy: 'category',
			termSlug: templateSlug.substring( 9 ),
		};
	}
	if ( templateSlug.startsWith( 'tag-' ) ) {
		return {
			...DEFAULT_CONTEXT,
			taxonomy: 'post_tag',
			termSlug: templateSlug.substring( 4 ),
		};
	}

	return DEFAULT_CONTEXT;
}

/**
 * Template slug parser that validates taxonomies exist.
 *
 * @param {string}   templateSlug The template slug to parse.
 * @param {Function} getTaxonomy  Function to get taxonomy record.
 * @return {Object} Object containing taxonomy, termSlug, isAuthor, and authorSlug.
 */
export function parseTemplateSlugWithValidation( templateSlug, getTaxonomy ) {
	if ( ! templateSlug ) {
		return DEFAULT_CONTEXT;
	}

	if ( templateSlug.startsWith( 'taxonomy-' ) ) {
		const taxonomyPart = templateSlug.substring( 9 );
		const taxonomyParts = taxonomyPart.split( '-' );

		// Check if the entire string is a valid taxonomy.
		const fullTaxonomyRecord = getTaxonomy( taxonomyPart );
		if ( fullTaxonomyRecord ) {
			return {
				...DEFAULT_CONTEXT,
				taxonomy: taxonomyPart,
			};
		}

		// Try splitting the taxonomy into parts to find a valid taxonomy.
		for ( let i = taxonomyParts.length - 1; i >= 1; i-- ) {
			const potentialTaxonomy = taxonomyParts.slice( 0, i ).join( '-' );
			const potentialTermSlug = taxonomyParts.slice( i ).join( '-' );

			const taxonomyRecord = getTaxonomy( potentialTaxonomy );
			if ( taxonomyRecord ) {
				return {
					...DEFAULT_CONTEXT,
					taxonomy: potentialTaxonomy,
					termSlug: potentialTermSlug,
				};
			}
		}

		// No valid taxonomy found.
		return DEFAULT_CONTEXT;
	}

	// For non-taxonomy prefixed slugs, use parseTemplateSlug.
	const parsedTemplateSlug = parseTemplateSlug( templateSlug );

	if ( parsedTemplateSlug.taxonomy && ! parsedTemplateSlug.isAuthor ) {
		const taxonomyRecord = getTaxonomy( parsedTemplateSlug.taxonomy );
		if ( ! taxonomyRecord ) {
			return DEFAULT_CONTEXT;
		}
	}

	return parsedTemplateSlug;
}

/**
 * Hook to get term context including term data and archive labels.
 *
 * @param {string|number} [termId]   The term ID from context (optional)
 * @param {string}        [taxonomy] The taxonomy name from context (optional)
 * @return {Object} Object containing term data, archive labels, and context information
 */
export function useTermContext( termId = null, taxonomy = null ) {
	const templateSlug = useTemplateSlug();

	const {
		taxonomy: fallbackTaxonomy,
		termSlug,
		isAuthor,
		authorSlug,
	} = useSelect(
		( select ) => {
			const { getTaxonomy } = select( coreStore );
			return parseTemplateSlugWithValidation( templateSlug, getTaxonomy );
		},
		[ templateSlug ]
	);

	const hasContext = Boolean( termId && taxonomy );

	// Get term from context.
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

	// Fallback: Get term from template.
	const templateBasedTerm = useSelect(
		( select ) => {
			if ( hasContext || ! fallbackTaxonomy || ! termSlug ) {
				return null;
			}

			const { getEntityRecords, getTaxonomy } = select( coreStore );
			const taxonomyRecord = getTaxonomy( fallbackTaxonomy );
			if ( ! taxonomyRecord ) {
				return null;
			}

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

	// Get archive labels.
	const archiveLabels = useSelect(
		( select ) => {
			const { getTaxonomy, getAuthors } = select( coreStore );
			let archiveTypeLabel;
			let archiveNameLabel;

			const currentTaxonomy = hasContext ? taxonomy : fallbackTaxonomy;

			if ( currentTaxonomy ) {
				archiveTypeLabel =
					getTaxonomy( currentTaxonomy )?.labels?.singular_name;
			}

			const currentTerm = hasContext
				? contextBasedTerm
				: templateBasedTerm;
			if ( currentTerm ) {
				archiveNameLabel = currentTerm.name;
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
		[
			hasContext,
			taxonomy,
			fallbackTaxonomy,
			contextBasedTerm,
			templateBasedTerm,
			isAuthor,
			authorSlug,
		]
	);

	return {
		hasContext,
		term: hasContext ? contextBasedTerm : templateBasedTerm,
		taxonomy: hasContext ? taxonomy : fallbackTaxonomy,
		...archiveLabels,
	};
}
