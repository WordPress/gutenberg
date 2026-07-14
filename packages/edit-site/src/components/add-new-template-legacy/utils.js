/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo, useCallback } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { blockMeta, post } from '@wordpress/icons';
import { safeDecodeURI } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	useDefaultTemplateTypes,
	useExistingTemplates,
	usePublicPostTypes,
	usePublicTaxonomies,
} from '../add-new-template/utils';

export {
	mapToIHasNameAndId,
	useDefaultTemplateTypes,
	useExistingTemplates,
	usePostTypeArchiveMenuItems,
	usePublicPostTypes,
	usePublicTaxonomies,
} from '../add-new-template/utils';

const EMPTY_OBJECT = {};

/**
 * Helper that adds a prefix to a post slug. The slug needs to be URL-decoded first,
 * so that we have raw Unicode characters there. The server will truncate the slug to
 * 200 characters, respecing Unicode char boundary. On the other hand, the server
 * doesn't detect urlencoded octet boundary and can possibly construct slugs that
 * are not valid urlencoded strings.
 * @param {string} prefix The prefix to add to the slug.
 * @param {string} slug   The slug to add the prefix to.
 * @return {string} The slug with the prefix.
 */
function prefixSlug( prefix, slug ) {
	return `${ prefix }-${ safeDecodeURI( slug ) }`;
}

/**
 * @typedef {Object} EntitiesInfo
 * @property {boolean}  hasEntities         If an entity has available records(posts, terms, etc..).
 * @property {number[]} existingEntitiesIds An array of the existing entities ids.
 */

export const usePostTypeMenuItems = ( onClickMenuItem ) => {
	const publicPostTypes = usePublicPostTypes();
	const existingTemplates = useExistingTemplates();
	const defaultTemplateTypes = useDefaultTemplateTypes();
	// We need to keep track of naming conflicts. If a conflict
	// occurs, we need to add slug.
	const templateLabels = useMemo(
		() =>
			publicPostTypes?.reduce( ( accumulator, { labels } ) => {
				const templateName = (
					labels.template_name || labels.singular_name
				).toLowerCase();
				accumulator[ templateName ] =
					( accumulator[ templateName ] || 0 ) + 1;
				return accumulator;
			}, {} ),
		[ publicPostTypes ]
	);
	const needsUniqueIdentifier = useCallback(
		( { labels, slug } ) => {
			const templateName = (
				labels.template_name || labels.singular_name
			).toLowerCase();
			return templateLabels[ templateName ] > 1 && templateName !== slug;
		},
		[ templateLabels ]
	);

	// `page`is a special case in template hierarchy.
	const templatePrefixes = useMemo(
		() =>
			publicPostTypes?.reduce( ( accumulator, { slug } ) => {
				let suffix = slug;
				if ( slug !== 'page' ) {
					suffix = `single-${ suffix }`;
				}
				accumulator[ slug ] = suffix;
				return accumulator;
			}, {} ),
		[ publicPostTypes ]
	);
	const postTypesInfo = useEntitiesInfo( 'postType', templatePrefixes );
	const existingTemplateSlugs = ( existingTemplates || [] ).map(
		( { slug } ) => slug
	);
	const menuItems = ( publicPostTypes || [] ).reduce(
		( accumulator, postType ) => {
			const { slug, labels, icon } = postType;
			// We need to check if the general template is part of the
			// defaultTemplateTypes. If it is, just use that info and
			// augment it with the specific template functionality.
			const generalTemplateSlug = templatePrefixes[ slug ];
			const defaultTemplateType = defaultTemplateTypes?.find(
				( { slug: _slug } ) => _slug === generalTemplateSlug
			);
			const hasGeneralTemplate =
				existingTemplateSlugs?.includes( generalTemplateSlug );
			const _needsUniqueIdentifier = needsUniqueIdentifier( postType );
			let menuItemTitle =
				labels.template_name ||
				sprintf(
					// translators: %s: Name of the post type e.g: "Post".
					__( 'Single item: %s' ),
					labels.singular_name
				);
			if ( _needsUniqueIdentifier ) {
				menuItemTitle = labels.template_name
					? sprintf(
							// translators: 1: Name of the template e.g: "Single Item: Post". 2: Slug of the post type e.g: "book".
							_x( '%1$s (%2$s)', 'post type menu label' ),
							labels.template_name,
							slug
					  )
					: sprintf(
							// translators: 1: Name of the post type e.g: "Post". 2: Slug of the post type e.g: "book".
							_x(
								'Single item: %1$s (%2$s)',
								'post type menu label'
							),
							labels.singular_name,
							slug
					  );
			}
			const menuItem = defaultTemplateType
				? {
						...defaultTemplateType,
						templatePrefix: templatePrefixes[ slug ],
				  }
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
						icon:
							typeof icon === 'string' &&
							icon.startsWith( 'dashicons-' )
								? icon.slice( 10 )
								: post,
						templatePrefix: templatePrefixes[ slug ],
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
								const templateSlug = prefixSlug(
									templatePrefixes[ slug ],
									suggestion.slug
								);
								return {
									title: templateSlug,
									slug: templateSlug,
									templatePrefix: templatePrefixes[ slug ],
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
	// `category` and `post_tag` are special cases in template hierarchy.
	const templatePrefixes = useMemo(
		() =>
			publicTaxonomies?.reduce( ( accumulator, { slug } ) => {
				let suffix = slug;
				if ( ! [ 'category', 'post_tag' ].includes( slug ) ) {
					suffix = `taxonomy-${ suffix }`;
				}
				if ( slug === 'post_tag' ) {
					suffix = `tag`;
				}
				accumulator[ slug ] = suffix;
				return accumulator;
			}, {} ),
		[ publicTaxonomies ]
	);
	// We need to keep track of naming conflicts. If a conflict
	// occurs, we need to add slug.
	const taxonomyLabels = publicTaxonomies?.reduce(
		( accumulator, { labels } ) => {
			const templateName = (
				labels.template_name || labels.singular_name
			).toLowerCase();
			accumulator[ templateName ] =
				( accumulator[ templateName ] || 0 ) + 1;
			return accumulator;
		},
		{}
	);
	const needsUniqueIdentifier = ( labels, slug ) => {
		if ( [ 'category', 'post_tag' ].includes( slug ) ) {
			return false;
		}
		const templateName = (
			labels.template_name || labels.singular_name
		).toLowerCase();
		return taxonomyLabels[ templateName ] > 1 && templateName !== slug;
	};
	const taxonomiesInfo = useEntitiesInfo( 'taxonomy', templatePrefixes );
	const existingTemplateSlugs = ( existingTemplates || [] ).map(
		( { slug } ) => slug
	);
	const menuItems = ( publicTaxonomies || [] ).reduce(
		( accumulator, taxonomy ) => {
			const { slug, labels } = taxonomy;
			// We need to check if the general template is part of the
			// defaultTemplateTypes. If it is, just use that info and
			// augment it with the specific template functionality.
			const generalTemplateSlug = templatePrefixes[ slug ];
			const defaultTemplateType = defaultTemplateTypes?.find(
				( { slug: _slug } ) => _slug === generalTemplateSlug
			);
			const hasGeneralTemplate =
				existingTemplateSlugs?.includes( generalTemplateSlug );
			const _needsUniqueIdentifier = needsUniqueIdentifier(
				labels,
				slug
			);
			let menuItemTitle = labels.template_name || labels.singular_name;
			if ( _needsUniqueIdentifier ) {
				menuItemTitle = labels.template_name
					? sprintf(
							// translators: 1: Name of the template e.g: "Products by Category". 2: Slug of the taxonomy e.g: "product_cat".
							_x( '%1$s (%2$s)', 'taxonomy template menu label' ),
							labels.template_name,
							slug
					  )
					: sprintf(
							// translators: 1: Name of the taxonomy e.g: "Category". 2: Slug of the taxonomy e.g: "product_cat".
							_x( '%1$s (%2$s)', 'taxonomy menu label' ),
							labels.singular_name,
							slug
					  );
			}
			const menuItem = defaultTemplateType
				? {
						...defaultTemplateType,
						templatePrefix: templatePrefixes[ slug ],
				  }
				: {
						slug: generalTemplateSlug,
						title: menuItemTitle,
						description: sprintf(
							// translators: %s: Name of the taxonomy e.g: "Product Categories".
							__( 'Displays taxonomy: %s.' ),
							labels.singular_name
						),
						icon: blockMeta,
						templatePrefix: templatePrefixes[ slug ],
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
								const templateSlug = prefixSlug(
									templatePrefixes[ slug ],
									suggestion.slug
								);
								return {
									title: templateSlug,
									slug: templateSlug,
									templatePrefix: templatePrefixes[ slug ],
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

const USE_AUTHOR_MENU_ITEM_TEMPLATE_PREFIX = { user: 'author' };
const USE_AUTHOR_MENU_ITEM_QUERY_PARAMETERS = { user: { who: 'authors' } };
export function useAuthorMenuItem( onClickMenuItem ) {
	const existingTemplates = useExistingTemplates();
	const defaultTemplateTypes = useDefaultTemplateTypes();
	const authorInfo = useEntitiesInfo(
		'root',
		USE_AUTHOR_MENU_ITEM_TEMPLATE_PREFIX,
		USE_AUTHOR_MENU_ITEM_QUERY_PARAMETERS
	);
	let authorMenuItem = defaultTemplateTypes?.find(
		( { slug } ) => slug === 'author'
	);
	if ( ! authorMenuItem ) {
		authorMenuItem = {
			description: __(
				'Displays latest posts written by a single author.'
			),
			slug: 'author',
			title: 'Author',
		};
	}
	const hasGeneralTemplate = !! existingTemplates?.find(
		( { slug } ) => slug === 'author'
	);
	if ( authorInfo.user?.hasEntities ) {
		authorMenuItem = { ...authorMenuItem, templatePrefix: 'author' };
		authorMenuItem.onClick = ( template ) => {
			onClickMenuItem( {
				type: 'root',
				slug: 'user',
				config: {
					queryArgs: ( { search } ) => {
						return {
							_fields: 'id,name,slug,link',
							orderBy: search ? 'name' : 'registered_date',
							exclude: authorInfo.user.existingEntitiesIds,
							who: 'authors',
						};
					},
					getSpecificTemplate: ( suggestion ) => {
						const templateSlug = prefixSlug(
							'author',
							suggestion.slug
						);
						return {
							title: templateSlug,
							slug: templateSlug,
							templatePrefix: 'author',
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

/**
 * Helper hook that filters all the existing templates by the given
 * object with the entity's slug as key and the template prefix as value.
 *
 * Example:
 * `existingTemplates` is: [ { slug: 'tag-apple' }, { slug: 'page-about' }, { slug: 'tag' } ]
 * `templatePrefixes` is: { post_tag: 'tag' }
 * It will return: { post_tag: ['apple'] }
 *
 * Note: We append the `-` to the given template prefix in this function for our checks.
 *
 * @param {Record<string,string>} templatePrefixes An object with the entity's slug as key and the template prefix as value.
 * @return {Record<string,string[]>} An object with the entity's slug as key and an array with the existing template slugs as value.
 */
const useExistingTemplateSlugs = ( templatePrefixes ) => {
	const existingTemplates = useExistingTemplates();
	const existingSlugs = useMemo( () => {
		return Object.entries( templatePrefixes || {} ).reduce(
			( accumulator, [ slug, prefix ] ) => {
				const slugsWithTemplates = ( existingTemplates || [] ).reduce(
					( _accumulator, existingTemplate ) => {
						const _prefix = `${ prefix }-`;
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
					accumulator[ slug ] = slugsWithTemplates;
				}
				return accumulator;
			},
			{}
		);
	}, [ templatePrefixes, existingTemplates ] );
	return existingSlugs;
};

/**
 * Helper hook that finds the existing records with an associated template,
 * as they need to be excluded from the template suggestions.
 *
 * @param {string}                entityName                The entity's name.
 * @param {Record<string,string>} templatePrefixes          An object with the entity's slug as key and the template prefix as value.
 * @param {Record<string,Object>} additionalQueryParameters An object with the entity's slug as key and additional query parameters as value.
 * @return {Record<string,EntitiesInfo>} An object with the entity's slug as key and the existing records as value.
 */
const useTemplatesToExclude = (
	entityName,
	templatePrefixes,
	additionalQueryParameters = {}
) => {
	const slugsToExcludePerEntity =
		useExistingTemplateSlugs( templatePrefixes );
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
						...additionalQueryParameters[ slug ],
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
 * @param {string}                entityName                The entity's name.
 * @param {Record<string,string>} templatePrefixes          An object with the entity's slug as key and the template prefix as value.
 * @param {Record<string,Object>} additionalQueryParameters An object with the entity's slug as key and additional query parameters as value.
 * @return {Record<string,EntitiesInfo>} An object with the entity's slug as key and the EntitiesInfo as value.
 */
const useEntitiesInfo = (
	entityName,
	templatePrefixes,
	additionalQueryParameters = EMPTY_OBJECT
) => {
	const recordsToExcludePerEntity = useTemplatesToExclude(
		entityName,
		templatePrefixes,
		additionalQueryParameters
	);
	const entitiesHasRecords = useSelect(
		( select ) => {
			return Object.keys( templatePrefixes || {} ).reduce(
				( accumulator, slug ) => {
					const existingEntitiesIds =
						recordsToExcludePerEntity?.[ slug ]?.map(
							( { id } ) => id
						) || [];
					const records = select( coreStore ).getEntityRecords(
						entityName,
						slug,
						{
							per_page: 1,
							_fields: 'id',
							context: 'view',
							exclude: existingEntitiesIds,
							...additionalQueryParameters[ slug ],
						}
					);
					accumulator[ slug ] =
						records === null || records.length > 0;
					return accumulator;
				},
				{}
			);
		},
		[
			templatePrefixes,
			recordsToExcludePerEntity,
			entityName,
			additionalQueryParameters,
		]
	);
	const entitiesInfo = useMemo( () => {
		return Object.keys( templatePrefixes || {} ).reduce(
			( accumulator, slug ) => {
				const existingEntitiesIds =
					recordsToExcludePerEntity?.[ slug ]?.map(
						( { id } ) => id
					) || [];
				accumulator[ slug ] = {
					hasEntities: entitiesHasRecords[ slug ],
					existingEntitiesIds,
				};
				return accumulator;
			},
			{}
		);
	}, [ templatePrefixes, recordsToExcludePerEntity, entitiesHasRecords ] );
	return entitiesInfo;
};
