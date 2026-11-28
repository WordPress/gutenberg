import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export function useArchiveLabel() {
	const templateSlug = useSelect( ( select ) => {
		// @wordpress/block-library should not depend on @wordpress/editor.
		// Blocks can be loaded into a *non-post* block editor, so to avoid
		// declaring @wordpress/editor as a dependency, we must access its
		// store by string.
		// The solution here is to split WP specific blocks from generic blocks.

		const { getCurrentPostId, getCurrentPostType, getCurrentTemplateId } =
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			select( 'core/editor' ) as {
				getCurrentPostId: () => number | undefined;
				getCurrentPostType: () => string | null;
				getCurrentTemplateId: () => string | null;
			};
		const currentPostType = getCurrentPostType();
		const templateId =
			getCurrentTemplateId() ||
			( currentPostType === 'wp_template' ? getCurrentPostId() : null );

		return templateId
			? (
					select( coreStore ).getEditedEntityRecord(
						'postType',
						'wp_template',
						templateId
					) as { slug?: string } | undefined
				 )?.slug
			: null;
	}, [] );
	const taxonomyMatches = templateSlug?.match(
		/^(category|tag|taxonomy-([^-]+))$|^(((category|tag)|taxonomy-([^-]+))-(.+))$/
	);
	let taxonomy: string | undefined;
	let term: string | undefined;
	let isAuthor = false;
	let authorSlug: string | undefined;
	if ( taxonomyMatches ) {
		// If is for a all taxonomies of a type
		if ( taxonomyMatches[ 1 ] ) {
			taxonomy = taxonomyMatches[ 2 ]
				? taxonomyMatches[ 2 ]
				: taxonomyMatches[ 1 ];
		}
		// If is for a all taxonomies of a type
		else if ( taxonomyMatches[ 3 ] ) {
			taxonomy = taxonomyMatches[ 6 ]
				? taxonomyMatches[ 6 ]
				: taxonomyMatches[ 4 ];
			term = taxonomyMatches[ 7 ];
		}
		taxonomy = taxonomy === 'tag' ? 'post_tag' : taxonomy;

		//getTaxonomy( 'category' );
		//wp.data.select('core').getEntityRecords( 'taxonomy', 'category', {slug: 'newcat'} );
	} else {
		const authorMatches = templateSlug?.match( /^(author)$|^author-(.+)$/ );
		if ( authorMatches ) {
			isAuthor = true;
			if ( authorMatches[ 2 ] ) {
				authorSlug = authorMatches[ 2 ];
			}
		}
	}
	return useSelect(
		( select ) => {
			const { getEntityRecords, getTaxonomy, getAuthors } =
				select( coreStore );
			let archiveTypeLabel: string | undefined;
			let archiveNameLabel: string | undefined;
			if ( taxonomy ) {
				archiveTypeLabel = (
					getTaxonomy( taxonomy ) as
						{ labels?: { singular_name?: string } } | undefined
				 )?.labels?.singular_name;
			}
			if ( term ) {
				const records = getEntityRecords< { name: string } >(
					'taxonomy',
					taxonomy!,
					{
						slug: term,
						per_page: 1,
					}
				);
				if ( records && records[ 0 ] ) {
					archiveNameLabel = records[ 0 ].name;
				}
			}
			if ( isAuthor ) {
				archiveTypeLabel = 'Author';
				if ( authorSlug ) {
					const authorRecords = getAuthors( { slug: authorSlug } );
					if ( authorRecords && authorRecords[ 0 ] ) {
						archiveNameLabel = authorRecords[ 0 ].name;
					}
				}
			}
			return {
				archiveTypeLabel,
				archiveNameLabel,
			};
		},
		[ authorSlug, isAuthor, taxonomy, term ]
	);
}
