/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { blockMeta, post } from '@wordpress/icons';

/**
 * @typedef IHasNameAndId
 * @property {string|number} id   The entity's id.
 * @property {string}        name The entity's name.
 */

/**
 * Helper util to map records to add a `name` prop from a
 * provided path, in order to handle all entities in the same
 * fashion(implementing`IHasNameAndId` interface).
 *
 * @param {Object[]} entities The array of entities.
 * @param {string}   path     The path to map a `name` property from the entity.
 * @return {IHasNameAndId[]} An array of enitities that now implement the `IHasNameAndId` interface.
 */
export const mapToIHasNameAndId = ( entities, path ) => {
	return ( entities || [] ).map( ( entity ) => ( {
		...entity,
		name: decodeEntities( get( entity, path ) ),
	} ) );
};

/**
 * @typedef {Object} EntitiesInfo
 * @property {boolean}  hasEntities         If an entity has available records(posts, terms, etc..).
 * @property {number[]} existingEntitiesIds An array of the existing entities ids.
 */

export const useExistingTemplates = () => {
	return useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', 'wp_template', {
				per_page: -1,
			} ),
		[]
	);
};

export const useDefaultTemplateTypes = () => {
	return useSelect(
		( select ) =>
			select( editorStore ).__experimentalGetDefaultTemplateTypes(),
		[]
	);
};

const usePublicPostTypes = () => {
	const postTypes = useSelect(
		( select ) => select( coreStore ).getPostTypes( { per_page: -1 } ),
		[]
	);
	return useMemo( () => {
		const excludedPostTypes = [ 'attachment' ];
		return postTypes?.filter(
			( { viewable, slug } ) =>
				viewable && ! excludedPostTypes.includes( slug )
		);
	}, [ postTypes ] );
};

const usePublicTaxonomies = () => {
	const taxonomies = useSelect(
		( select ) => select( coreStore ).getTaxonomies( { per_page: -1 } ),
		[]
	);
	return useMemo( () => {
		return taxonomies?.filter(
			( { visibility } ) => visibility?.publicly_queryable
		);
	}, [ taxonomies ] );
};

export const usePostTypeMenuItems = ( onClickMenuItem ) => {
	const publicPostTypes = usePublicPostTypes();
	const existingTemplates = useExistingTemplates();
	const defaultTemplateTypes = useDefaultTemplateTypes();
	// `page`is a special case in template hierarchy.
	const templateEntityObject = useMemo(
		() =>
			publicPostTypes?.map( ( { slug } ) => {
				return {
					entitySlug: slug,
					// `page`is a special case in template hierarchy.
					templatePrefix:
						slug !== 'page' ? `single-${ slug }` : 'page',
				};
			} ),
		[ publicPostTypes ]
	);
	// We need to keep track of naming conflicts. If a conflict
	// occurs, we need to add slug.
	const postTypeLabels = publicPostTypes?.reduce(
		( accumulator, { labels } ) => {
			const singularName = labels.singular_name.toLowerCase();
			accumulator[ singularName ] =
				( accumulator[ singularName ] || 0 ) + 1;
			return accumulator;
		},
		{}
	);
	const needsUniqueIdentifier = ( labels, slug ) => {
		const singularName = labels.singular_name.toLowerCase();
		return postTypeLabels[ singularName ] > 1 && singularName !== slug;
	};
	const postTypesInfo = useEntitiesInfo( 'postType', templateEntityObject );
	const existingTemplateSlugs = ( existingTemplates || [] ).map(
		( { slug } ) => slug
	);
	const menuItems = ( publicPostTypes || [] ).reduce(
		( accumulator, postType, index ) => {
			const { slug, labels, icon } = postType;

			const generalTemplateSlug =
				templateEntityObject[ index ].templatePrefix;
			// We need to check if the general template is part of the
			// defaultTemplateTypes. If it is, just use that info and
			// augment it with the specific template functionality.
			const defaultTemplateType = defaultTemplateTypes?.find(
				( { slug: _slug } ) => _slug === generalTemplateSlug
			);
			const hasGeneralTemplate =
				existingTemplateSlugs?.includes( generalTemplateSlug );
			const _needsUniqueIdentifier = needsUniqueIdentifier(
				labels,
				slug
			);
			let menuItemTitle = sprintf(
				// translators: %s: Name of the post type e.g: "Post".
				__( 'Single item: %s' ),
				labels.singular_name
			);
			if ( _needsUniqueIdentifier ) {
				menuItemTitle = sprintf(
					// translators: %1s: Name of the post type e.g: "Post"; %2s: Slug of the post type e.g: "book".
					__( 'Single item: %1$s (%2$s)' ),
					labels.singular_name,
					slug
				);
			}
			const menuItem = defaultTemplateType
				? { ...defaultTemplateType }
				: {
						slug: generalTemplateSlug,
						title: menuItemTitle,
						description: sprintf(
							// translators: %s: Name of the post type e.g: "Post".
							__( 'Displays a single item: %s.' ),
							labels.singular_name
						),
						// `icon` is the `menu_icon` property of a post type. We
						// only handle `dashicons` for now, even if the `menu_icon`
						// also supports urls and svg as values.
						icon: icon?.startsWith( 'dashicons-' )
							? icon.slice( 10 )
							: post,
				  };
			const hasEntities = postTypesInfo?.[ slug ]?.hasEntities;
			// We have a different template creation flow only if they have entities.
			if ( hasEntities ) {
				menuItem.onClick = ( template ) => {
					onClickMenuItem( {
						type: 'postType',
						slug,
						config: {
							recordNamePath: 'title.rendered',
							queryArgs: ( { search } ) => {
								return {
									_fields: 'id,title,slug,link',
									orderBy: search ? 'relevance' : 'modified',
									exclude:
										postTypesInfo[ slug ]
											.existingEntitiesIds,
								};
							},
							getSpecificTemplate: ( suggestion ) => {
								let title = sprintf(
									// translators: Represents the title of a user's custom template in the Site Editor, where %1$s is the singular name of a post type and %2$s is the name of the post, e.g. "Page: Hello".
									__( '%1$s: %2$s' ),
									labels.singular_name,
									suggestion.name
								);
								const description = sprintf(
									// translators: Represents the description of a user's custom template in the Site Editor, e.g. "Template for Page: Hello"
									__( 'Template for %1$s' ),
									title
								);
								if ( _needsUniqueIdentifier ) {
									title = sprintf(
										// translators: Represents the title of a user's custom template in the Site Editor, where %1$s is the template title and %2$s is the slug of the post type, e.g. "Project: Hello (project_type)"
										__( '%1$s (%2$s)' ),
										title,
										slug
									);
								}
								return {
									title,
									description,
									slug: `${ generalTemplateSlug }-${ suggestion.slug }`,
								};
							},
						},
						labels,
						hasGeneralTemplate,
						template,
					} );
				};
			}
			// We don't need to add the menu item if there are no
			// entities and the general template exists.
			if ( ! hasGeneralTemplate || hasEntities ) {
				accumulator.push( menuItem );
			}
			return accumulator;
		},
		[]
	);
	// Split menu items into two groups: one for the default post types
	// and one for the rest.
	const postTypesMenuItems = useMemo(
		() =>
			menuItems.reduce(
				( accumulator, postType ) => {
					const { slug } = postType;
					let key = 'postTypesMenuItems';
					if ( slug === 'page' ) {
						key = 'defaultPostTypesMenuItems';
					}
					accumulator[ key ].push( postType );
					return accumulator;
				},
				{ defaultPostTypesMenuItems: [], postTypesMenuItems: [] }
			),
		[ menuItems ]
	);
	return postTypesMenuItems;
};

export const useTaxonomiesMenuItems = ( onClickMenuItem ) => {
	const publicTaxonomies = usePublicTaxonomies();
	const existingTemplates = useExistingTemplates();
	const defaultTemplateTypes = useDefaultTemplateTypes();

	const templateEntityObject = useMemo(
		() =>
			publicTaxonomies?.map( ( { slug } ) => {
				let templatePrefix;
				// `category` and `post_tag` are special cases in template hierarchy.
				switch ( slug ) {
					case 'category':
						templatePrefix = 'category';
						break;
					case 'post_tag':
						templatePrefix = 'tag';
						break;
					default:
						templatePrefix = `taxonomy-${ slug }`;
				}
				return {
					templatePrefix,
					entitySlug: slug,
				};
			} ),
		[ publicTaxonomies ]
	);
	// We need to keep track of naming conflicts. If a conflict
	// occurs, we need to add slug.
	const taxonomyLabels = publicTaxonomies?.reduce(
		( accumulator, { labels } ) => {
			const singularName = labels.singular_name.toLowerCase();
			accumulator[ singularName ] =
				( accumulator[ singularName ] || 0 ) + 1;
			return accumulator;
		},
		{}
	);
	const needsUniqueIdentifier = ( labels, slug ) => {
		if ( [ 'category', 'post_tag' ].includes( slug ) ) {
			return false;
		}
		const singularName = labels.singular_name.toLowerCase();
		return taxonomyLabels[ singularName ] > 1 && singularName !== slug;
	};
	const taxonomiesInfo = useEntitiesInfo( 'taxonomy', templateEntityObject );
	const existingTemplateSlugs = ( existingTemplates || [] ).map(
		( { slug } ) => slug
	);
	const menuItems = ( publicTaxonomies || [] ).reduce(
		( accumulator, taxonomy, index ) => {
			const { slug, labels } = taxonomy;
			const generalTemplateSlug =
				templateEntityObject[ index ].templatePrefix;
			// We need to check if the general template is part of the
			// defaultTemplateTypes. If it is, just use that info and
			// augment it with the specific template functionality.
			const defaultTemplateType = defaultTemplateTypes?.find(
				( { slug: _slug } ) => _slug === generalTemplateSlug
			);
			const hasGeneralTemplate =
				existingTemplateSlugs?.includes( generalTemplateSlug );
			const _needsUniqueIdentifier = needsUniqueIdentifier(
				labels,
				slug
			);
			let menuItemTitle = labels.singular_name;
			if ( _needsUniqueIdentifier ) {
				menuItemTitle = sprintf(
					// translators: %1s: Name of the taxonomy e.g: "Category"; %2s: Slug of the taxonomy e.g: "product_cat".
					__( '%1$s (%2$s)' ),
					labels.singular_name,
					slug
				);
			}
			const menuItem = defaultTemplateType
				? { ...defaultTemplateType }
				: {
						slug: generalTemplateSlug,
						title: menuItemTitle,
						description: sprintf(
							// translators: %s: Name of the taxonomy e.g: "Product Categories".
							__( 'Displays taxonomy: %s.' ),
							labels.singular_name
						),
						icon: blockMeta,
				  };
			const hasEntities = taxonomiesInfo?.[ slug ]?.hasEntities;
			// We have a different template creation flow only if they have entities.
			if ( hasEntities ) {
				menuItem.onClick = ( template ) => {
					onClickMenuItem( {
						type: 'taxonomy',
						slug,
						config: {
							queryArgs: ( { search } ) => {
								return {
									_fields: 'id,name,slug,link',
									orderBy: search ? 'name' : 'count',
									exclude:
										taxonomiesInfo[ slug ]
											.existingEntitiesIds,
								};
							},
							getSpecificTemplate: ( suggestion ) => {
								let title = sprintf(
									// translators: Represents the title of a user's custom template in the Site Editor, where %1$s is the singular name of a taxonomy and %2$s is the name of the term, e.g. "Category: shoes".
									__( '%1$s: %2$s' ),
									labels.singular_name,
									suggestion.name
								);
								const description = sprintf(
									// translators: Represents the description of a user's custom template in the Site Editor, e.g. "Template for Category: shoes"
									__( 'Template for %1$s' ),
									title
								);
								if ( _needsUniqueIdentifier ) {
									title = sprintf(
										// translators: Represents the title of a user's custom template in the Site Editor, where %1$s is the template title and %2$s is the slug of the taxonomy, e.g. "Category: shoes (product_tag)"
										__( '%1$s (%2$s)' ),
										title,
										slug
									);
								}
								return {
									title,
									description,
									slug: `${ generalTemplateSlug }-${ suggestion.slug }`,
								};
							},
						},
						labels,
						hasGeneralTemplate,
						template,
					} );
				};
			}
			// We don't need to add the menu item if there are no
			// entities and the general template exists.
			if ( ! hasGeneralTemplate || hasEntities ) {
				accumulator.push( menuItem );
			}
			return accumulator;
		},
		[]
	);
	// Split menu items into two groups: one for the default taxonomies
	// and one for the rest.
	const taxonomiesMenuItems = useMemo(
		() =>
			menuItems.reduce(
				( accumulator, taxonomy ) => {
					const { slug } = taxonomy;
					let key = 'taxonomiesMenuItems';
					if ( [ 'category', 'tag' ].includes( slug ) ) {
						key = 'defaultTaxonomiesMenuItems';
					}
					accumulator[ key ].push( taxonomy );
					return accumulator;
				},
				{ defaultTaxonomiesMenuItems: [], taxonomiesMenuItems: [] }
			),
		[ menuItems ]
	);
	return taxonomiesMenuItems;
};

export function useAuthorMenuItem( onClickMenuItem ) {
	const existingTemplates = useExistingTemplates();
	const defaultTemplateTypes = useDefaultTemplateTypes();
	const authorInfo = useEntitiesInfo(
		'root',
		useAuthorMenuItem.AUTHOR_TEMPLATE_ENTITY_OBJECT
	);
	let authorMenuItem = defaultTemplateTypes?.find(
		( { slug } ) => slug === 'author'
	);
	const hasGeneralTemplate = existingTemplates?.find(
		( { slug } ) => slug === 'author'
	);
	if ( authorMenuItem && authorInfo.user?.hasEntities ) {
		authorMenuItem = { ...authorMenuItem };
		authorMenuItem.onClick = ( template ) => {
			onClickMenuItem( {
				type: 'root',
				slug: 'user',
				config: {
					queryArgs: ( { search } ) => {
						return {
							_fields: 'id,name,slug,link',
							orderBy: search ? 'name' : 'count',
							exclude: authorInfo.user.existingEntitiesIds,
							who: 'authors',
						};
					},
					getSpecificTemplate: ( suggestion ) => {
						const title = sprintf(
							// translators: %s: Represents the name of an author e.g: "Jorge".
							__( 'Author: %s' ),
							suggestion.name
						);
						const description = sprintf(
							// translators: %s: Represents the name of an author e.g: "Jorge".
							__( 'Template for Author: %s' ),
							suggestion.name
						);
						return {
							title,
							description,
							slug: `author-${ suggestion.slug }`,
						};
					},
				},
				labels: {
					singular_name: __( 'Author' ),
					search_items: __( 'Search Authors' ),
					not_found: __( 'No authors found.' ),
					all_items: __( 'All Authors' ),
				},
				hasGeneralTemplate,
				template,
			} );
		};
	}
	if ( ! hasGeneralTemplate || authorInfo.user?.hasEntities ) {
		return authorMenuItem;
	}
}
useAuthorMenuItem.AUTHOR_TEMPLATE_ENTITY_OBJECT = [
	{
		entitySlug: 'user',
		templatePrefix: 'author',
		additionalQueryParameters: { who: 'author' },
	},
];

/**
 * Helper hook that filters all the existing templates by the given
 * object with the entity's slug as key and the template prefix as value.
 *
 * Example:
 * `existingTemplates` is: [ { slug: 'tag-apple' }, { slug: 'page-about' }, { slug: 'tag' } ]
 * `templateEntityObject` is: [ { entitySlug: post_tag, templatePrefix: 'tag' } ]
 * It will return: { post_tag: ['apple'] }
 *
 * Note: We append the `-` to the given template prefix in this function for our checks.
 *
 * @param {Array<Object?>} templateEntityObject An object with the entity's slug as key and the template prefix as value.
 * @return {Record<string,string[]>} An object with the entity's slug as key and an array with the existing template slugs as value.
 */
const useExistingTemplateSlugs = ( templateEntityObject ) => {
	const existingTemplates = useExistingTemplates();
	const existingSlugs = useMemo( () => {
		return ( templateEntityObject || [] ).reduce(
			( accumulator, { entitySlug, templatePrefix } ) => {
				const slugsWithTemplates = ( existingTemplates || [] ).reduce(
					( _accumulator, existingTemplate ) => {
						const _prefix = `${ templatePrefix }-`;
						if ( existingTemplate.slug.startsWith( _prefix ) ) {
							_accumulator.push(
								existingTemplate.slug.substring(
									_prefix.length
								)
							);
						}
						return _accumulator;
					},
					[]
				);
				if ( slugsWithTemplates.length ) {
					accumulator[ entitySlug ] = slugsWithTemplates;
				}
				return accumulator;
			},
			{}
		);
	}, [ templateEntityObject, existingTemplates ] );
	return existingSlugs;
};

/**
 * Helper hook that finds the existing records with an associated template,
 * as they need to be excluded from the template suggestions.
 *
 * @param {string}         entityName           The entity's name.
 * @param {Array<Object?>} templateEntityObject An object with the entity's slug as key and the template prefix as value.
 * @return {Record<string,EntitiesInfo>} An object with the entity's slug as key and the existing records as value.
 */
const useTemplatesToExclude = ( entityName, templateEntityObject ) => {
	const slugsToExcludePerEntity =
		useExistingTemplateSlugs( templateEntityObject );
	const recordsToExcludePerEntity = useSelect(
		( select ) => {
			return Object.entries( slugsToExcludePerEntity || {} ).reduce(
				( accumulator, [ slug, slugsWithTemplates ] ) => {
					const entitiesWithTemplates = select(
						coreStore
					).getEntityRecords( entityName, slug, {
						_fields: 'id',
						context: 'view',
						slug: slugsWithTemplates,
					} );
					if ( entitiesWithTemplates?.length ) {
						accumulator[ slug ] = entitiesWithTemplates;
					}
					return accumulator;
				},
				{}
			);
		},
		[ slugsToExcludePerEntity ]
	);
	return recordsToExcludePerEntity;
};

/**
 * Helper hook that returns information about an entity having
 * records that we can create a specific template for.
 *
 * For example we can search for `terms` in `taxonomy` entity or
 * `posts` in `postType` entity.
 *
 * First we need to find the existing records with an associated template,
 * to query afterwards for any remaining record, by excluding them.
 *
 * @param {string}         entityName           The entity's name.
 * @param {Array<Object?>} templateEntityObject An object with the entity's slug as key and the template prefix as value.
 * @return {Record<string,EntitiesInfo>} An object with the entity's slug as key and the EntitiesInfo as value.
 */
const useEntitiesInfo = ( entityName, templateEntityObject ) => {
	const recordsToExcludePerEntity = useTemplatesToExclude(
		entityName,
		templateEntityObject
	);
	const entitiesInfo = useSelect(
		( select ) => {
			return ( templateEntityObject || [] ).reduce(
				( accumulator, { entitySlug, additionalQueryParameters } ) => {
					const existingEntitiesIds =
						recordsToExcludePerEntity?.[ entitySlug ]?.map(
							( { id } ) => id
						) || [];
					accumulator[ entitySlug ] = {
						hasEntities: !! select( coreStore ).getEntityRecords(
							entityName,
							entitySlug,
							{
								per_page: 1,
								_fields: 'id',
								context: 'view',
								exclude: existingEntitiesIds,
								...( additionalQueryParameters || {} ),
							}
						)?.length,
						existingEntitiesIds,
					};
					return accumulator;
				},
				{}
			);
		},
		[ templateEntityObject, recordsToExcludePerEntity ]
	);
	return entitiesInfo;
};
