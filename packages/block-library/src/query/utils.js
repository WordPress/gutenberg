/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import {
	cloneBlock,
	getBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';

/** @typedef {import('@wordpress/blocks').WPBlockVariation} WPBlockVariation */
/** @typedef {import('@wordpress/components/build-types/query-controls/types').OrderByOption} OrderByOption */

/**
 * @typedef IHasNameAndId
 * @property {string|number} id   The entity's id.
 * @property {string}        name The entity's name.
 */

/**
 * The object used in Query block that contains info and helper mappings
 * from an array of IHasNameAndId objects.
 *
 * @typedef {Object} QueryEntitiesInfo
 * @property {IHasNameAndId[]}               entities  The array of entities.
 * @property {Object<string, IHasNameAndId>} mapById   Object mapping with the id as key and the entity as value.
 * @property {Object<string, IHasNameAndId>} mapByName Object mapping with the name as key and the entity as value.
 * @property {string[]}                      names     Array with the entities' names.
 */

/**
 * Returns a helper object with mapping from Objects that implement
 * the `IHasNameAndId` interface. The returned object is used for
 * integration with `FormTokenField` component.
 *
 * @param {IHasNameAndId[]} entities The entities to extract of helper object.
 * @return {QueryEntitiesInfo} The object with the entities information.
 */
export const getEntitiesInfo = ( entities ) => {
	const mapping = entities?.reduce(
		( accumulator, entity ) => {
			const { mapById, mapByName, names } = accumulator;
			mapById[ entity.id ] = entity;
			mapByName[ entity.name ] = entity;
			names.push( entity.name );
			return accumulator;
		},
		{ mapById: {}, mapByName: {}, names: [] }
	);
	return {
		entities,
		...mapping,
	};
};

/**
 * Helper util to return a value from a certain path of the object.
 * Path is specified as a string of properties, separated by dots,
 * for example: "parent.child".
 *
 * @param {Object} object Input object.
 * @param {string} path   Path to the object property.
 * @return {*} Value of the object property at the specified path.
 */
export const getValueFromObjectPath = ( object, path ) => {
	const normalizedPath = path.split( '.' );
	let value = object;
	normalizedPath.forEach( ( fieldName ) => {
		value = value?.[ fieldName ];
	} );
	return value;
};

/**
 * Helper util to map records to add a `name` prop from a
 * provided path, in order to handle all entities in the same
 * fashion(implementing`IHasNameAndId` interface).
 *
 * @param {Object[]} entities The array of entities.
 * @param {string}   path     The path to map a `name` property from the entity.
 * @return {IHasNameAndId[]} An array of entities that now implement the `IHasNameAndId` interface.
 */
export const mapToIHasNameAndId = ( entities, path ) => {
	return ( entities || [] ).map( ( entity ) => ( {
		...entity,
		name: decodeEntities( getValueFromObjectPath( entity, path ) ),
	} ) );
};

/**
 * Returns a helper object that contains:
 * 1. An `options` object from the available post types, to be passed to a `SelectControl`.
 * 2. A helper map with available taxonomies per post type.
 * 3. A helper map with post format support per post type.
 *
 * @return {Object} The helper object related to post types.
 */
export const usePostTypes = () => {
	const postTypes = useSelect( ( select ) => {
		const { getPostTypes } = select( coreStore );
		const excludedPostTypes = [ 'attachment' ];
		const filteredPostTypes = getPostTypes( { per_page: -1 } )?.filter(
			( { viewable, slug } ) =>
				viewable && ! excludedPostTypes.includes( slug )
		);
		return filteredPostTypes;
	}, [] );
	const postTypesTaxonomiesMap = useMemo( () => {
		if ( ! postTypes?.length ) {
			return;
		}
		return postTypes.reduce( ( accumulator, type ) => {
			accumulator[ type.slug ] = type.taxonomies;
			return accumulator;
		}, {} );
	}, [ postTypes ] );
	const postTypesSelectOptions = useMemo(
		() =>
			( postTypes || [] ).map( ( { labels, slug } ) => ( {
				label: labels.singular_name,
				value: slug,
			} ) ),
		[ postTypes ]
	);
	const postTypeFormatSupportMap = useMemo( () => {
		if ( ! postTypes?.length ) {
			return {};
		}
		return postTypes.reduce( ( accumulator, type ) => {
			accumulator[ type.slug ] =
				type.supports?.[ 'post-formats' ] || false;
			return accumulator;
		}, {} );
	}, [ postTypes ] );
	return {
		postTypesTaxonomiesMap,
		postTypesSelectOptions,
		postTypeFormatSupportMap,
	};
};

/**
 * Hook that returns the taxonomies associated with a specific post type.
 *
 * @param {string} postType The post type from which to retrieve the associated taxonomies.
 * @return {Object[]} An array of the associated taxonomies.
 */
export const useTaxonomies = ( postType ) => {
	const taxonomies = useSelect(
		( select ) => {
			const { getTaxonomies, getPostType } = select( coreStore );
			// Does the post type have taxonomies?
			if ( getPostType( postType )?.taxonomies?.length > 0 ) {
				return getTaxonomies( {
					type: postType,
					per_page: -1,
				} );
			}
			return [];
		},
		[ postType ]
	);
	return useMemo( () => {
		return taxonomies?.filter(
			( { visibility } ) => !! visibility?.publicly_queryable
		);
	}, [ taxonomies ] );
};

/**
 * Hook that returns whether a specific post type is hierarchical.
 *
 * @param {string} postType The post type to check.
 * @return {boolean} Whether a specific post type is hierarchical.
 */
export function useIsPostTypeHierarchical( postType ) {
	return useSelect(
		( select ) => {
			const type = select( coreStore ).getPostType( postType );
			return type?.viewable && type?.hierarchical;
		},
		[ postType ]
	);
}

/**
 * List of avaiable options to order by.
 *
 * @param {string} postType The post type to check.
 * @return {OrderByOption[]} List of order options.
 */
export function useOrderByOptions( postType ) {
	const supportsCustomOrder = useSelect(
		( select ) => {
			const type = select( coreStore ).getPostType( postType );
			return !! type?.supports?.[ 'page-attributes' ];
		},
		[ postType ]
	);

	return useMemo( () => {
		const orderByOptions = [
			{
				label: __( 'Newest to oldest' ),
				value: 'date/desc',
			},
			{
				label: __( 'Oldest to newest' ),
				value: 'date/asc',
			},
			{
				/* translators: Label for ordering posts by title in ascending order. */
				label: __( 'A → Z' ),
				value: 'title/asc',
			},
			{
				/* translators: Label for ordering posts by title in descending order. */
				label: __( 'Z → A' ),
				value: 'title/desc',
			},
		];

		if ( supportsCustomOrder ) {
			orderByOptions.push(
				{
					/* translators: Label for ordering posts by ascending menu order. */
					label: __( 'Ascending by order' ),
					value: 'menu_order/asc',
				},
				{
					/* translators: Label for ordering posts by descending menu order. */
					label: __( 'Descending by order' ),
					value: 'menu_order/desc',
				}
			);
		}

		return orderByOptions;
	}, [ supportsCustomOrder ] );
}

/**
 * Hook that returns the query properties' names defined by the active
 * block variation, to determine which block's filters to show.
 *
 * @param {Object} attributes Block attributes.
 * @return {string[]} An array of the query attributes.
 */
export function useAllowedControls( attributes ) {
	return useSelect(
		( select ) =>
			select( blocksStore ).getActiveBlockVariation(
				'core/query',
				attributes
			)?.allowedControls,

		[ attributes ]
	);
}
export function isControlAllowed( allowedControls, key ) {
	// Every controls is allowed if the list is not defined.
	if ( ! allowedControls ) {
		return true;
	}
	return allowedControls.includes( key );
}

/**
 * Clones a pattern's blocks and then recurses over that list of blocks,
 * transforming them to retain some `query` attribute properties.
 * For now we retain the `postType` and `inherit` properties as they are
 * fundamental for the expected functionality of the block and don't affect
 * its design and presentation.
 *
 * Returns the cloned/transformed blocks and array of existing Query Loop
 * client ids for further manipulation, in order to avoid multiple recursions.
 *
 * @param {WPBlock[]}        blocks               The list of blocks to look through and transform(mutate).
 * @param {Record<string,*>} queryBlockAttributes The existing Query Loop's attributes.
 * @return {{ newBlocks: WPBlock[], queryClientIds: string[] }} An object with the cloned/transformed blocks and all the Query Loop clients from these blocks.
 */
export const getTransformedBlocksFromPattern = (
	blocks,
	queryBlockAttributes
) => {
	const {
		query: { postType, inherit },
		namespace,
	} = queryBlockAttributes;
	const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
	const queryClientIds = [];
	const blocksQueue = [ ...clonedBlocks ];
	while ( blocksQueue.length > 0 ) {
		const block = blocksQueue.shift();
		if ( block.name === 'core/query' ) {
			block.attributes.query = {
				...block.attributes.query,
				postType,
				inherit,
			};
			if ( namespace ) {
				block.attributes.namespace = namespace;
			}
			queryClientIds.push( block.clientId );
		}
		block.innerBlocks?.forEach( ( innerBlock ) => {
			blocksQueue.push( innerBlock );
		} );
	}
	return { newBlocks: clonedBlocks, queryClientIds };
};

/**
 * Helper hook that determines if there is an active variation of the block
 * and if there are available specific patterns for this variation.
 * If there are, these patterns are going to be the only ones suggested to
 * the user in setup and replace flow, without including the default ones
 * for Query Loop.
 *
 * If there are no such patterns, the default ones for Query Loop are going
 * to be suggested.
 *
 * @param {string} clientId   The block's client ID.
 * @param {Object} attributes The block's attributes.
 * @return {string} The block name to be used in the patterns suggestions.
 */
export function useBlockNameForPatterns( clientId, attributes ) {
	return useSelect(
		( select ) => {
			const activeVariationName = select(
				blocksStore
			).getActiveBlockVariation( 'core/query', attributes )?.name;

			if ( ! activeVariationName ) {
				return 'core/query';
			}

			const { getBlockRootClientId, getPatternsByBlockTypes } =
				select( blockEditorStore );

			const rootClientId = getBlockRootClientId( clientId );
			const activePatterns = getPatternsByBlockTypes(
				`core/query/${ activeVariationName }`,
				rootClientId
			);

			return activePatterns.length > 0
				? `core/query/${ activeVariationName }`
				: 'core/query';
		},
		[ clientId, attributes ]
	);
}

/**
 * Helper hook that determines if there is an active variation of the block
 * and if there are available specific scoped `block` variations connected with
 * this variation.
 *
 * If there are, these variations are going to be the only ones suggested
 * to the user in setup flow when clicking to `start blank`, without including
 * the default ones for Query Loop.
 *
 * If there are no such scoped `block` variations, the default ones for Query
 * Loop are going to be suggested.
 *
 * The way we determine such variations is with the convention that they have the `namespace`
 * attribute defined as an array. This array should contain the names(`name` property) of any
 * variations they want to be connected to.
 * For example, if we have a `Query Loop` scoped `inserter` variation with the name `products`,
 * we can connect a scoped `block` variation by setting its `namespace` attribute to `['products']`.
 * If the user selects this variation, the `namespace` attribute will be overridden by the
 * main `inserter` variation.
 *
 * @param {Object} attributes The block's attributes.
 * @return {WPBlockVariation[]} The block variations to be suggested in setup flow, when clicking to `start blank`.
 */
export function useScopedBlockVariations( attributes ) {
	const { activeVariationName, blockVariations } = useSelect(
		( select ) => {
			const { getActiveBlockVariation, getBlockVariations } =
				select( blocksStore );
			return {
				activeVariationName: getActiveBlockVariation(
					'core/query',
					attributes
				)?.name,
				blockVariations: getBlockVariations( 'core/query', 'block' ),
			};
		},
		[ attributes ]
	);
	const variations = useMemo( () => {
		// Filter out the variations that have defined a `namespace` attribute,
		// which means they are 'connected' to specific variations of the block.
		const isNotConnected = ( variation ) =>
			! variation.attributes?.namespace;
		if ( ! activeVariationName ) {
			return blockVariations.filter( isNotConnected );
		}
		const connectedVariations = blockVariations.filter( ( variation ) =>
			variation.attributes?.namespace?.includes( activeVariationName )
		);
		if ( !! connectedVariations.length ) {
			return connectedVariations;
		}
		return blockVariations.filter( isNotConnected );
	}, [ activeVariationName, blockVariations ] );
	return variations;
}

/**
 * Hook that returns the block patterns for a specific block type.
 *
 * @param {string} clientId The block's client ID.
 * @param {string} name     The block type name.
 * @return {Object[]} An array of valid block patterns.
 */
export const usePatterns = ( clientId, name ) => {
	return useSelect(
		( select ) => {
			const { getBlockRootClientId, getPatternsByBlockTypes } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			return getPatternsByBlockTypes( name, rootClientId );
		},
		[ name, clientId ]
	);
};

/**
 * Hook that, given a block clientId, determines if it has unsupported blocks or not.
 *
 * @param {string} clientId The block's client ID.
 * @return {boolean} True if there are any unsupported blocks.
 */
export const useUnsupportedBlocks = ( clientId ) => {
	return useSelect(
		( select ) => {
			const { getClientIdsOfDescendants, getBlockName } =
				select( blockEditorStore );
			return getClientIdsOfDescendants( clientId ).some(
				( descendantClientId ) => {
					const blockName = getBlockName( descendantClientId );
					/*
					 * Client side navigation can be true in two states:
					 *  - supports.interactivity = true;
					 *  - supports.interactivity.clientNavigation = true;
					 */
					const blockSupportsInteractivity = Object.is(
						getBlockSupport( blockName, 'interactivity' ),
						true
					);
					const blockSupportsInteractivityClientNavigation =
						getBlockSupport(
							blockName,
							'interactivity.clientNavigation'
						);

					return (
						! blockSupportsInteractivity &&
						! blockSupportsInteractivityClientNavigation
					);
				}
			);
		},
		[ clientId ]
	);
};

/**
 * Helper function that returns the query context from the editor based on the
 * available template slug.
 *
 * @param {string} templateSlug Current template slug based on context.
 * @return {Object} An object with isSingular and templateType properties.
 */
export function getQueryContextFromTemplate( templateSlug ) {
	// In the Post Editor, the template slug is not available.
	if ( ! templateSlug ) {
		return { isSingular: true };
	}
	let isSingular = false;
	let templateType = templateSlug === 'wp' ? 'custom' : templateSlug;
	const singularTemplates = [ '404', 'blank', 'single', 'page', 'custom' ];
	const templateTypeFromSlug = templateSlug.includes( '-' )
		? templateSlug.split( '-', 1 )[ 0 ]
		: templateSlug;
	const queryFromTemplateSlug = templateSlug.includes( '-' )
		? templateSlug.split( '-' ).slice( 1 ).join( '-' )
		: '';
	if ( queryFromTemplateSlug ) {
		templateType = templateTypeFromSlug;
	}
	isSingular = singularTemplates.includes( templateType );

	return { isSingular, templateType };
}
