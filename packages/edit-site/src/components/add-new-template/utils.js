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

/**
 * @typedef {Object} EntityConfig
 * @property {string}   entityName        The entity's name.
 * @property {Function} getOrderBy        Getter for an entity's `orderBy` query parameter, given the object
 *                                        {search} as argument.
 * @property {Function} getIcon           Getter function for returning an entity's icon for the menu item.
 * @property {Function} getTitle          Getter function for returning an entity's title for the menu item.
 * @property {Function} getDescription    Getter function for returning an entity's description for the menu item.
 * @property {string}   recordNamePath    The path to an entity's properties to use as a `name`. If not provided
 *                                        is assumed that `name` property exists.
 * @property {string}   templatePrefix    The template prefix to create new templates and check against existing
 *                                        templates. For example custom post types need a `single-` prefix to all
 *                                        templates(`single-post-hello`), whereas `pages` don't (`page-hello`).
 * @property {string}   aliasTemplateSlug If this property is provided, is going to be used for the creation of
 *                                        new templates and the check against existing templates in the place
 *                                        of the actual entity's `slug`. An example is `Tag` templates where the
 *                                        the Tag's taxonomy slug is `post_tag`, but template hierarchy is based
 *                                        on `tag` alias.
 */

const taxonomyBaseConfig = {
	entityName: 'taxonomy',
	getOrderBy: ( { search } ) => ( search ? 'name' : 'count' ),
	getIcon: () => blockMeta,
	getTitle: ( labels ) =>
		sprintf(
			// translators: %s: Name of the post type e.g: "Post".
			__( 'Single taxonomy: %s' ),
			labels.singular_name
		),
	getDescription: ( labels ) =>
		sprintf(
			// translators: %s: Name of the taxonomy e.g: "Product Categories".
			__( 'Displays a single taxonomy: %s.' ),
			labels.singular_name
		),
};
export const entitiesConfig = {
	postType: {
		entityName: 'postType',
		templatePrefix: 'single-',
		getOrderBy: ( { search } ) => ( search ? 'relevance' : 'modified' ),
		recordNamePath: 'title.rendered',
		// `icon` is the `menu_icon` property of a post type. We
		// only handle `dashicons` for now, even if the `menu_icon`
		// also supports urls and svg as values.
		getIcon: ( _icon ) =>
			_icon?.startsWith( 'dashicons-' ) ? _icon.slice( 10 ) : post,
		getTitle: ( labels ) =>
			sprintf(
				// translators: %s: Name of the post type e.g: "Post".
				__( 'Single item: %s' ),
				labels.singular_name
			),
		getDescription: ( labels ) =>
			sprintf(
				// translators: %s: Name of the post type e.g: "Post".
				__( 'Displays a single item: %s.' ),
				labels.singular_name
			),
	},
	taxonomy: {
		...taxonomyBaseConfig,
		templatePrefix: 'taxonomy-',
	},
	category: { ...taxonomyBaseConfig },
	tag: { ...taxonomyBaseConfig, aliasTemplateSlug: 'tag' },
};

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

export const usePostTypes = () => {
	const postTypes = useSelect(
		( select ) => select( coreStore ).getPostTypes( { per_page: -1 } ),
		[]
	);
	return useMemo( () => {
		const excludedPostTypes = [ 'attachment', 'page' ];
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

/**
 * `category` and `post_tag` are handled specifically in template
 * hierarchy so we need to differentiate them and return the rest,
 * e.g. `category-$slug` and `taxonomy-$taxonomy-$term`.
 */
export const useTaxonomies = () => {
	const taxonomies = usePublicTaxonomies();
	const specialTaxonomies = [ 'category', 'post_tag' ];
	return useMemo(
		() =>
			taxonomies?.filter(
				( { slug } ) => ! specialTaxonomies.includes( slug )
			),
		[ taxonomies ]
	);
};

export const useTaxonomyCategory = () => {
	const taxonomies = usePublicTaxonomies();
	return useMemo(
		() => taxonomies?.filter( ( { slug } ) => slug === 'category' ),
		[ taxonomies ]
	);
};
export const useTaxonomyTag = () => {
	const taxonomies = usePublicTaxonomies();
	return useMemo(
		() => taxonomies?.filter( ( { slug } ) => slug === 'post_tag' ),
		[ taxonomies ]
	);
};

/**
 * Helper hook that returns information about an entity having
 * records that we can create a specific template for.
 *
 * For example we can search for `terms` in `taxonomy` entity or
 * `posts` in `postType` entity.
 *
 * First we need to find the existing records with an associated template,
 * to query afterwards for any remaing record, by excluding them.
 *
 * @param {string[]}     existingTemplates The existing templates.
 * @param {Object[]}     entities          The array of entities we need to get extra information.
 * @param {EntityConfig} entityConfig      The entity config.
 * @return {Record<string,EntitiesInfo>} An object with the `entities.slug` as `keys` and EntitiesInfo as values.
 */
const useEntitiesInfo = (
	existingTemplates,
	entities,
	{ entityName, templatePrefix, aliasTemplateSlug }
) => {
	const slugsToExcludePerEntity = useMemo( () => {
		return entities?.reduce( ( accumulator, entity ) => {
			const slugsWithTemplates = ( existingTemplates || [] ).reduce(
				( _accumulator, existingTemplate ) => {
					let _prefix = `${ aliasTemplateSlug || entity.slug }-`;
					if ( templatePrefix ) {
						_prefix = templatePrefix + _prefix;
					}
					if ( existingTemplate.slug.startsWith( _prefix ) ) {
						_accumulator.push(
							existingTemplate.slug.substring( _prefix.length )
						);
					}
					return _accumulator;
				},
				[]
			);
			if ( slugsWithTemplates.length ) {
				accumulator[ entity.slug ] = slugsWithTemplates;
			}
			return accumulator;
		}, {} );
	}, [ entities, existingTemplates ] );
	const recordsToExcludePerEntity = useSelect(
		( select ) => {
			if ( ! slugsToExcludePerEntity ) {
				return;
			}
			return Object.entries( slugsToExcludePerEntity ).reduce(
				( accumulator, [ slug, slugsWithTemplates ] ) => {
					const postsWithTemplates = select(
						coreStore
					).getEntityRecords( entityName, slug, {
						_fields: 'id',
						context: 'view',
						slug: slugsWithTemplates,
					} );
					if ( postsWithTemplates?.length ) {
						accumulator[ slug ] = postsWithTemplates;
					}
					return accumulator;
				},
				{}
			);
		},
		[ slugsToExcludePerEntity ]
	);
	const entitiesInfo = useSelect(
		( select ) => {
			return entities?.reduce( ( accumulator, { slug } ) => {
				const existingEntitiesIds =
					recordsToExcludePerEntity?.[ slug ]?.map(
						( { id } ) => id
					) || [];
				accumulator[ slug ] = {
					hasEntities: !! select( coreStore ).getEntityRecords(
						entityName,
						slug,
						{
							per_page: 1,
							_fields: 'id',
							context: 'view',
							exclude: existingEntitiesIds,
						}
					)?.length,
					existingEntitiesIds,
				};
				return accumulator;
			}, {} );
		},
		[ entities, recordsToExcludePerEntity ]
	);
	return entitiesInfo;
};

export const useExtraTemplates = (
	entities,
	entityConfig,
	onClickMenuItem
) => {
	const existingTemplates = useExistingTemplates();
	const defaultTemplateTypes = useDefaultTemplateTypes();
	const entitiesInfo = useEntitiesInfo(
		existingTemplates,
		entities,
		entityConfig
	);
	const existingTemplateSlugs = ( existingTemplates || [] ).map(
		( { slug } ) => slug
	);
	const extraTemplates = ( entities || [] ).reduce(
		( accumulator, _postType ) => {
			const { slug, labels, icon } = _postType;
			// TODO: add/move/remove comments :)
			// `post_tag` seems to be the only exception in template
			// hierarchy that doesn't use the `slug` for its general
			// template. Instead it uses `tag`.
			// I'm not sure how to fit this in a generic util like this,
			// if it's indeed the only case..
			const slugForGeneralTemplate =
				entityConfig.aliasTemplateSlug || slug;
			// We need to check if the general template is part of the
			// defaultTemplateTypes. If it is, just use that info and
			// augment it with the specific template functionality.
			const defaultTemplateType = defaultTemplateTypes?.find(
				( { slug: _slug } ) => _slug === slugForGeneralTemplate
			);
			const generalTemplateSlug =
				defaultTemplateType?.slug ||
				`${ entityConfig.templatePrefix }${ slug }`;
			const hasGeneralTemplate =
				existingTemplateSlugs?.includes( generalTemplateSlug );
			const menuItem = defaultTemplateType
				? { ...defaultTemplateType }
				: {
						slug: generalTemplateSlug,
						title: entityConfig.getTitle( labels ),
						description: entityConfig.getDescription( labels ),
						icon: entityConfig.getIcon?.( icon ),
				  };
			const hasEntities = entitiesInfo?.[ slug ]?.hasEntities;
			// We have a different template creation flow only if they have entities.
			if ( hasEntities ) {
				menuItem.onClick = ( template ) => {
					onClickMenuItem( {
						type: entityConfig.entityName,
						slug,
						config: entityConfig,
						labels,
						hasGeneralTemplate,
						template,
						postsToExclude:
							entitiesInfo[ slug ].existingEntitiesIds,
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
	return extraTemplates;
};
