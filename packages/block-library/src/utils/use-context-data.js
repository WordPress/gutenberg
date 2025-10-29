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
 * Creates a context object for taxonomy cases.
 *
 * @param {string}      taxonomy The taxonomy name.
 * @param {string|null} termSlug The term slug (optional).
 * @return {Object} Context object with taxonomy and optional term set.
 */
function createContext( taxonomy, termSlug = null ) {
	return {
		taxonomy,
		termSlug,
		isAuthor: false,
		authorSlug: null,
	};
}

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
			taxonomy: null,
			termSlug: null,
			isAuthor: true,
			authorSlug: authorMatches[ 2 ] || null,
		};
	}

	// Check for taxonomy patterns
	// e.g. taxonomy-product-category, taxonomy-product-category-electronics
	if ( templateSlug.startsWith( 'taxonomy-' ) ) {
		const taxonomyPart = templateSlug.substring( 9 );

		// Find dash positions
		const dashIndices = [];
		for ( let i = 0; i < taxonomyPart.length; i++ ) {
			if ( taxonomyPart[ i ] === '-' ) {
				dashIndices.push( i );
			}
		}

		if ( dashIndices.length > 0 ) {
			// If there's only one dash, treat it as taxonomy.
			// If there are multiple dashes, use the last one as the split point.
			if ( dashIndices.length === 1 ) {
				// Single dash
				// e.g. taxonomy-product-category -> taxonomy: "product-category", term: null
				return createContext( taxonomyPart );
			}

			// Multiple dashes
			// e.g. taxonomy-product-category-electronics -> taxonomy: "product-category", term: "electronics"
			const lastDashIndex = dashIndices[ dashIndices.length - 1 ];
			const taxonomy = taxonomyPart.substring( 0, lastDashIndex );
			const termSlug = taxonomyPart.substring( lastDashIndex + 1 );

			return createContext( taxonomy, termSlug );
		}

		// No dashes, so the entire part is the taxonomy
		return createContext( taxonomyPart );
	}

	// Check for built-in taxonomy patterns
	// e.g. category, tag
	if ( templateSlug === 'category' ) {
		return createContext( 'category' );
	}
	if ( templateSlug === 'tag' ) {
		return createContext( 'post_tag' );
	}

	// Check for specific term patterns for built-in taxonomies
	// e.g. category-news, tag-featured
	if ( templateSlug.startsWith( 'category-' ) ) {
		return createContext( 'category', templateSlug.substring( 9 ) );
	}
	if ( templateSlug.startsWith( 'tag-' ) ) {
		return createContext( 'post_tag', templateSlug.substring( 4 ) );
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
		const dashIndices = [];

		// Find all dash positions.
		for ( let i = 0; i < taxonomyPart.length; i++ ) {
			if ( taxonomyPart[ i ] === '-' ) {
				dashIndices.push( i );
			}
		}

		// If we have dashes, try different split points to find a valid taxonomy
		if ( dashIndices.length > 0 ) {
			for ( let i = 0; i < dashIndices.length; i++ ) {
				const splitIndex = dashIndices[ i ];
				const potentialTaxonomy = taxonomyPart.substring(
					0,
					splitIndex
				);
				const potentialTermSlug = taxonomyPart.substring(
					splitIndex + 1
				);

				// Check if this taxonomy exists
				const taxonomyRecord = getTaxonomy( potentialTaxonomy );
				if ( taxonomyRecord ) {
					return createContext(
						potentialTaxonomy,
						potentialTermSlug
					);
				}
			}
		}

		// If no valid split found, try the entire string as taxonomy.
		const taxonomyRecord = getTaxonomy( taxonomyPart );
		if ( taxonomyRecord ) {
			return createContext( taxonomyPart );
		}

		// No valid taxonomy found.
		return DEFAULT_CONTEXT;
	}

	// For non-taxonomy prefixed slugs, use the basic parsing
	const basicParse = parseTemplateSlug( templateSlug );

	if ( basicParse.taxonomy && ! basicParse.isAuthor ) {
		const taxonomyRecord = getTaxonomy( basicParse.taxonomy );
		if ( ! taxonomyRecord ) {
			return DEFAULT_CONTEXT;
		}
	}

	return basicParse;
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
