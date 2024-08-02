/**
 * WordPress dependencies
 */
import { createSelector, createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { State } from './selectors';
import { STORE_NAME } from './name';

type EntityRecordKey = string | number;

type TemplateQuery = {
	slug: string;
	is_custom?: boolean;
};

/**
 * Returns the previous edit from the current undo offset
 * for the entity records edits history, if any.
 *
 * @param state State tree.
 *
 * @return The undo manager.
 */
export function getUndoManager( state: State ) {
	return state.undoManager;
}

/**
 * Retrieve the fallback Navigation.
 *
 * @param state Data state.
 * @return The ID for the fallback Navigation post.
 */
export function getNavigationFallbackId(
	state: State
): EntityRecordKey | undefined {
	return state.navigationFallbackId;
}

export const getBlockPatternsForPostType = createRegistrySelector(
	( select: any ) =>
		createSelector(
			( state, postType ) =>
				select( STORE_NAME )
					.getBlockPatterns()
					.filter(
						( { postTypes } ) =>
							! postTypes ||
							( Array.isArray( postTypes ) &&
								postTypes.includes( postType ) )
					),
			() => [ select( STORE_NAME ).getBlockPatterns() ]
		)
);

/**
 * Returns the entity records permissions for the given entity record ids.
 */
export const getEntityRecordsPermissions = createRegistrySelector( ( select ) =>
	createSelector(
		( state: State, kind: string, name: string, ids: string[] ) => {
			const normalizedIds = Array.isArray( ids ) ? ids : [ ids ];
			return normalizedIds.map( ( id ) => ( {
				delete: select( STORE_NAME ).canUser( 'delete', {
					kind,
					name,
					id,
				} ),
				update: select( STORE_NAME ).canUser( 'update', {
					kind,
					name,
					id,
				} ),
			} ) );
		},
		( state ) => [ state.userPermissions ]
	)
);

/**
 * Returns the entity record permissions for the given entity record id.
 *
 * @param state Data state.
 * @param kind  Entity kind.
 * @param name  Entity name.
 * @param id    Entity record id.
 *
 * @return The entity record permissions.
 */
export function getEntityRecordPermissions(
	state: State,
	kind: string,
	name: string,
	id: string
) {
	return getEntityRecordsPermissions( state, kind, name, id )[ 0 ];
}

export const getRelatedEditedEntityRecordsByTemplate = createRegistrySelector(
	( select ) =>
		createSelector(
			( state: State, template: TemplateQuery ) => {
				/*
				 * Get the relationship between the template slug and the entity records.
				 * Similar to how the Template Hierarchy works: https://developer.wordpress.org/themes/basics/template-hierarchy/
				 *
				 * It returns the specific entity record if it is specified and if not it returns the root entity record.
				 *
				 * These are the possible slugs and the related entities.
				 *
				 * ARCHIVES
				 *
				 * archive:                         Any taxonomy, author, and date.
				 * author:                          Author archives.
				 * author-{user-slug}:              Specific author.
				 * category:                        Taxonomy "category" archives.
				 * category-{category-slug}:        Specific category.
				 * date:                            Post archive for a specific date.
				 * tag:                             Taxonomy "post_tag" archives.
				 * tag-{tag-slug}:                  Specific tag.
				 * taxonomy-{tax-slug}:             Specific taxonomy archives.
				 * taxonomy-{tax-slug}-{item-slug}: Specific item of a specific taxonomy.
				 *
				 * POST TYPES
				 *
				 * index:                         Any post type.
				 * page:                          Post type "page".
				 * page-{page-slug}:              Specific "page".
				 * single:                        Post type "post".
				 * single-post:                   Post type "post".
				 * single-post-{post-slug}:       Specific "post".
				 * single-{cpt-slug}:             Specific post type.
				 * single-{cpt-slug}-{item-slug}: Specific item of a specific post type.
				 *
				 * SPECIAL CASES
				 *
				 * home:       Latest posts as either the site homepage or as the "Posts page".
				 * front-page: Homepage whether it is set to display latest posts or a static page. Overrides `home`.
				 * 404:        Displays when a visitor views a non-existent page.
				 * search:     Displays when a visitor performs a search on the website.
				 *
				 * Custom templates apply to posts, pages, or custom post types.
				 */

				// TODO: Review archive-{post-type} and attachment.
				// TODO: Await somehow for getEntityRecords calls.

				const { slug, is_custom: isCustom } = template;

				// Custom templates.
				if ( isCustom ) {
					// Return all post types.
					return select( STORE_NAME ).getEntityRecords(
						'root',
						'postType'
					);
				}

				// Homepage templates.
				if ( slug === 'home' || slug === 'front-page' ) {
					// TODO: Review how to get the page on front.
					const { page_on_front: pageOnFront } = select(
						STORE_NAME
					).getEntityRecord( 'root', 'site' );

					if ( pageOnFront === 0 ) {
						// Homepage displays latest posts.
						const postsEntity = select(
							STORE_NAME
						).getEntityRecord( 'root', 'postType', 'posts' );
						return postsEntity ? [ postsEntity ] : undefined;
					}
					// Homepage displays a static page.
					const pageEntity = select( STORE_NAME ).getEntityRecord(
						'postType',
						'page',
						pageOnFront
					);
					return pageEntity ? [ pageEntity ] : undefined;
				}

				// Special cases.
				// TODO: Review what to return in these cases.
				if ( slug === 'date' || slug === '404' || slug === 'search' ) {
					return;
				}

				// First item corresponds to the type.
				// eslint-disable-next-line @wordpress/no-unused-vars-before-return
				const [ type, ...slugParts ] = slug.split( '-' );

				// Author archives.
				// TODO: Review what to return in these cases.
				if ( type === 'author' ) {
					return;
				}

				// Build the query.
				let kind, entitySlug, itemSlug;

				// Get the `kind`.
				switch ( type ) {
					case 'archive':
					case 'taxonomy':
					case 'category':
					case 'tag':
						kind = 'taxonomy';
						break;

					case 'index':
					case 'single':
					case 'page':
						kind = 'postType';
						break;
				}

				// Generate the `entitySlug` and `itemSlug`.
				switch ( type ) {
					case 'category':
						entitySlug = 'category';
						if ( slugParts.length ) {
							itemSlug = slugParts.join( '-' );
						}
						break;

					case 'tag':
						entitySlug = 'post_tag';
						if ( slugParts.length ) {
							itemSlug = slugParts.join( '-' );
						}
						break;

					case 'page':
						entitySlug = 'page';
						if ( slugParts.length ) {
							itemSlug = slugParts.join( '-' );
						}
						break;

					case 'taxonomy':
					case 'single':
						/*
						 * Extract entitySlug and itemSlug from the slugParts.
						 * Slugs can contain dashes.
						 *
						 * taxonomy-{tax-slug}
						 * taxonomy-{tax-slug}-{item-slug}
						 * single
						 * single-{cpt-slug}
						 * single-{cpt-slug}-{item-slug}
						 */
						if ( ! slugParts.length ) {
							if ( type === 'single' ) {
								entitySlug = 'post';
							}
							break;
						}
						let firstSlug = '';
						for ( let i = 0; i < slugParts.length; i++ ) {
							if ( firstSlug === '' ) {
								firstSlug = slugParts[ i ];
							} else {
								firstSlug += `-${ slugParts[ i ] }`;
							}

							// Check if the current combination is an existing taxonomy or post type.
							// TODO: Check better way to get defined taxonomies or post types.
							const existingPostTypes = Object.keys(
								state.entities.records.postType
							);
							const existingTaxonomies = Object.keys(
								state.entities.records.taxonomy
							);
							if (
								existingTaxonomies.includes( firstSlug ) ||
								existingPostTypes.includes( firstSlug )
							) {
								entitySlug = firstSlug;
								const remainingParts = slugParts.slice( i + 1 );
								if ( remainingParts.length ) {
									itemSlug = remainingParts.join( '-' );
								}
								break;
							}
						}
						break;
				}

				if ( ! entitySlug ) {
					/*
					 * archive
					 * index
					 */
					return select( STORE_NAME ).getEntityRecords(
						'root',
						kind
					);
				}

				if ( ! itemSlug ) {
					/*
					 * category
					 * tag
					 * taxonomy-{tax-slug}
					 * page
					 * single
					 * single-{cpt-slug}
					 */

					// It seems it is not possible to filter by slug in `getEntityRecords`.
					const rootEntity = select( STORE_NAME ).getEntityRecord(
						'root',
						kind,
						entitySlug
					);
					return rootEntity ? [ rootEntity ] : undefined;
				}

				/*
				 * category-{category-slug}
				 * tag-{tag-slug}
				 * page-{page-slug}
				 * taxonomy-{tax-slug}-{item-slug}
				 * single-{cpt-slug}-{item-slug}
				 */
				return select( STORE_NAME ).getEntityRecords(
					kind,
					entitySlug,
					{
						slug: itemSlug,
					}
				);
			},
			// TODO: Review what to include here.
			( state ) => [ state.entities.records ]
		)
);
