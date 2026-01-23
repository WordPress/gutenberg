/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useMemo, useCallback } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { blockMeta, post, archive } from '@wordpress/icons';
import { safeDecodeURI } from '@wordpress/url';

const TEMPLATE_POST_TYPE = 'wp_template';
const EMPTY_OBJECT = {};

/**
 * @typedef IHasNameAndId
 * @property {string|number} id   The entity's id.
 * @property {string}        name The entity's name.
 */

interface IHasNameAndId {
	id: string | number;
	name: string;
}

const getValueFromObjectPath = ( object: any, path: string ): any => {
	let value = object;
	path.split( '.' ).forEach( ( fieldName ) => {
		value = value?.[ fieldName ];
	} );
	return value;
};

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
function prefixSlug( prefix: string, slug: string ): string {
	return `${ prefix }-${ safeDecodeURI( slug ) }`;
}

/**
 * Helper util to map records to add a `name` prop from a
 * provided path, in order to handle all entities in the same
 * fashion(implementing`IHasNameAndId` interface).
 *
 * @param {Object[]} entities The array of entities.
 * @param {string}   path     The path to map a `name` property from the entity.
 * @return {IHasNameAndId[]} An array of entities that now implement the `IHasNameAndId` interface.
 */
export function mapToIHasNameAndId< T >(
	entities: T[],
	path: string
): ( T & { name: string } )[] {
	return ( entities || [] ).map( ( entity ) => ( {
		...entity,
		name: decodeEntities( getValueFromObjectPath( entity, path ) ),
	} ) );
}

/**
 * @typedef {Object} EntitiesInfo
 * @property {boolean}  hasEntities         If an entity has available records(posts, terms, etc..).
 * @property {number[]} existingEntitiesIds An array of the existing entities ids.
 */

interface EntitiesInfo {
	hasEntities: boolean;
	existingEntitiesIds?: number[];
}

export const useExistingTemplates = () => {
	return useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords(
				'postType',
				TEMPLATE_POST_TYPE,
				{
					per_page: -1,
				}
			),
		[]
	);
};

export const useDefaultTemplateTypes = () => {
	return useSelect(
		( select ) =>
			select( coreStore ).getCurrentTheme()?.default_template_types || [],
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
		return postTypes
			?.filter(
				( { viewable, slug }: any ) =>
					viewable && ! excludedPostTypes.includes( slug )
			)
			.sort( ( a: any, b: any ) => {
				// Sort post types alphabetically by name,
				// but exclude the built-in 'post' type from sorting.
				if ( a.slug === 'post' || b.slug === 'post' ) {
					return 0;
				}

				return a.name.localeCompare( b.name );
			} );
	}, [ postTypes ] );
};

const usePublicTaxonomies = () => {
	const taxonomies = useSelect(
		( select ) => select( coreStore ).getTaxonomies( { per_page: -1 } ),
		[]
	);
	return useMemo( () => {
		return taxonomies?.filter(
			( { visibility }: any ) => visibility?.publicly_queryable
		);
	}, [ taxonomies ] );
};

export function usePostTypeArchiveMenuItems() {
	const publicPostTypes = usePublicPostTypes();
	const postTypesWithArchives = useMemo(
		() =>
			publicPostTypes?.filter(
				( postType: any ) => postType.has_archive
			),
		[ publicPostTypes ]
	);
	const existingTemplates = useExistingTemplates();
	// We need to keep track of naming conflicts. If a conflict
	// occurs, we need to add slug.
	const postTypeLabels = useMemo(
		() =>
			publicPostTypes?.reduce( ( accumulator: any, { labels }: any ) => {
				const singularName = labels.singular_name.toLowerCase();
				accumulator[ singularName ] =
					( accumulator[ singularName ] || 0 ) + 1;
				return accumulator;
			}, {} ),
		[ publicPostTypes ]
	);
	const needsUniqueIdentifier = useCallback(
		( { labels, slug }: any ) => {
			const singularName = labels.singular_name.toLowerCase();
			return postTypeLabels[ singularName ] > 1 && singularName !== slug;
		},
		[ postTypeLabels ]
	);
	return useMemo(
		() =>
			postTypesWithArchives
				?.filter(
					( postType: any ) =>
						! ( existingTemplates || [] ).some(
							( existingTemplate: any ) =>
								existingTemplate.slug ===
								'archive-' + postType.slug
						)
				)
				.map( ( postType: any ) => {
					let title;
					if ( needsUniqueIdentifier( postType ) ) {
						title = sprintf(
							// translators: %1s: Name of the post type e.g: "Post"; %2s: Slug of the post type e.g: "book".
							__( 'Archive: %1$s (%2$s)' ),
							postType.labels.singular_name,
							postType.slug
						);
					} else {
						title = sprintf(
							// translators: %s: Name of the post type e.g: "Post".
							__( 'Archive: %s' ),
							postType.labels.singular_name
						);
					}
					return {
						slug: 'archive-' + postType.slug,
						description: sprintf(
							// translators: %s: Name of the post type e.g: "Post".
							__(
								'Displays an archive with the latest posts of type: %s.'
							),
							postType.labels.singular_name
						),
						title,
						// `icon` is the `menu_icon` property of a post type. We
						// only handle `dashicons` for now, even if the `menu_icon`
						// also supports urls and svg as values.
						icon:
							typeof postType.icon === 'string' &&
							postType.icon.startsWith( 'dashicons-' )
								? postType.icon.slice( 10 )
								: archive,
						templatePrefix: 'archive',
					};
				} ) || [],
		[ postTypesWithArchives, existingTemplates, needsUniqueIdentifier ]
	);
}

export const usePostTypeMenuItems = (
	onClickMenuItem: ( entity: any ) => void
) => {
	const publicPostTypes = usePublicPostTypes();
	const defaultTemplateTypes = useDefaultTemplateTypes();
	// We need to keep track of naming conflicts. If a conflict
	// occurs, we need to add slug.
	const templateLabels = useMemo(
		() =>
			publicPostTypes?.reduce( ( accumulator: any, { labels }: any ) => {
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
		( { labels, slug }: any ) => {
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
			publicPostTypes?.reduce( ( accumulator: any, { slug }: any ) => {
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
	const menuItems = ( publicPostTypes || [] ).reduce(
		( accumulator: any[], postType: any ) => {
			const { slug, labels, icon } = postType;
			// We need to check if the general template is part of the
			// defaultTemplateTypes. If it is, just use that info and
			// augment it with the specific template functionality.
			const generalTemplateSlug = templatePrefixes[ slug ];
			const defaultTemplateType = defaultTemplateTypes?.find(
				( { slug: _slug }: any ) => _slug === generalTemplateSlug
			);
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
				menuItem.onClick = ( template: any ) => {
					onClickMenuItem( {
						type: 'postType',
						slug,
						config: {
							recordNamePath: 'title.rendered',
							queryArgs: ( { search }: any ) => {
								return {
									_fields: 'id,title,slug,link',
									orderBy: search ? 'relevance' : 'modified',
									exclude:
										postTypesInfo[ slug ]
											.existingEntitiesIds,
								};
							},
							getSpecificTemplate: ( suggestion: any ) => {
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
						template,
					} );
				};
			}
			// We don't need to add the menu item if there are no entities.
			if ( hasEntities ) {
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
				( accumulator: any, postType: any ) => {
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

export const useTaxonomiesMenuItems = (
	onClickMenuItem: ( entity: any ) => void
) => {
	const publicTaxonomies = usePublicTaxonomies();
	const existingTemplates = useExistingTemplates();
	const defaultTemplateTypes = useDefaultTemplateTypes();
	// `category` and `post_tag` are special cases in template hierarchy.
	const templatePrefixes = useMemo(
		() =>
			publicTaxonomies?.reduce( ( accumulator: any, { slug }: any ) => {
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
		( accumulator: any, { labels }: any ) => {
			const templateName = (
				labels.template_name || labels.singular_name
			).toLowerCase();
			accumulator[ templateName ] =
				( accumulator[ templateName ] || 0 ) + 1;
			return accumulator;
		},
		{}
	);
	const needsUniqueIdentifier = ( labels: any, slug: string ) => {
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
		( { slug }: any ) => slug
	);
	const menuItems = ( publicTaxonomies || [] ).reduce(
		( accumulator: any[], taxonomy: any ) => {
			const { slug, labels } = taxonomy;
			// We need to check if the general template is part of the
			// defaultTemplateTypes. If it is, just use that info and
			// augment it with the specific template functionality.
			const generalTemplateSlug = templatePrefixes[ slug ];
			const defaultTemplateType = defaultTemplateTypes?.find(
				( { slug: _slug }: any ) => _slug === generalTemplateSlug
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
				menuItem.onClick = ( template: any ) => {
					onClickMenuItem( {
						type: 'taxonomy',
						slug,
						config: {
							queryArgs: ( { search }: any ) => {
								return {
									_fields: 'id,name,slug,link',
									orderBy: search ? 'name' : 'count',
									exclude:
										taxonomiesInfo[ slug ]
											.existingEntitiesIds,
								};
							},
							getSpecificTemplate: ( suggestion: any ) => {
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
				( accumulator: any, taxonomy: any ) => {
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

const USE_AUTHOR_MENU_ITEM_TEMPLATE_PREFIX: Record< string, string > = {
	user: 'author',
};
const USE_AUTHOR_MENU_ITEM_QUERY_PARAMETERS: Record< string, any > = {
	user: { who: 'authors' },
};
export function useAuthorMenuItem( onClickMenuItem: ( entity: any ) => void ) {
	const existingTemplates = useExistingTemplates();
	const defaultTemplateTypes = useDefaultTemplateTypes();
	const authorInfo = useEntitiesInfo(
		'root',
		USE_AUTHOR_MENU_ITEM_TEMPLATE_PREFIX,
		USE_AUTHOR_MENU_ITEM_QUERY_PARAMETERS
	);
	let authorMenuItem: any = defaultTemplateTypes?.find(
		( { slug }: any ) => slug === 'author'
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
		( { slug }: any ) => slug === 'author'
	);
	if ( authorInfo.user?.hasEntities ) {
		authorMenuItem = { ...authorMenuItem, templatePrefix: 'author' };
		authorMenuItem.onClick = ( template: any ) => {
			onClickMenuItem( {
				type: 'root',
				slug: 'user',
				config: {
					queryArgs: ( { search }: any ) => {
						return {
							_fields: 'id,name,slug,link',
							orderBy: search ? 'name' : 'registered_date',
							exclude: authorInfo.user.existingEntitiesIds,
							who: 'authors',
						};
					},
					getSpecificTemplate: ( suggestion: any ) => {
						const templateSlug = prefixSlug(
							'author',
							suggestion.slug
						);
						return {
							title: sprintf(
								// translators: %s: Name of the author e.g: "Admin".
								__( 'Author: %s' ),
								suggestion.name
							),
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
	entityName: string,
	templatePrefixes: Record< string, string >,
	additionalQueryParameters: Record< string, any > = EMPTY_OBJECT
): Record< string, EntitiesInfo > => {
	const entitiesHasRecords = useSelect(
		( select ) => {
			return Object.keys( templatePrefixes || {} ).reduce(
				( accumulator: any, slug ) => {
					accumulator[ slug ] = !! select(
						coreStore
					).getEntityRecords( entityName, slug, {
						per_page: 1,
						_fields: 'id',
						context: 'view',
						...additionalQueryParameters[ slug ],
					} )?.length;
					return accumulator;
				},
				{}
			);
		},
		[ templatePrefixes, entityName, additionalQueryParameters ]
	);
	const entitiesInfo = useMemo( () => {
		return Object.keys( templatePrefixes || {} ).reduce(
			( accumulator: any, slug ) => {
				accumulator[ slug ] = {
					hasEntities: entitiesHasRecords[ slug ],
				};
				return accumulator;
			},
			{}
		);
	}, [ templatePrefixes, entitiesHasRecords ] );
	return entitiesInfo;
};
