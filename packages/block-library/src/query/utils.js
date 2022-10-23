/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { cloneBlock, store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { name as queryLoopName } from './block.json';

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
 * Returns a helper object that contains:
 * 1. An `options` object from the available post types, to be passed to a `SelectControl`.
 * 2. A helper map with available taxonomies per post type.
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
		if ( ! postTypes?.length ) return;
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
	return { postTypesTaxonomiesMap, postTypesSelectOptions };
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
			const { getTaxonomies } = select( coreStore );
			const filteredTaxonomies = getTaxonomies( {
				type: postType,
				per_page: -1,
				context: 'view',
			} );
			return filteredTaxonomies;
		},
		[ postType ]
	);
	return taxonomies;
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
				queryLoopName,
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
	const activeVariationName = useSelect(
		( select ) =>
			select( blocksStore ).getActiveBlockVariation(
				queryLoopName,
				attributes
			)?.name,

		[ attributes ]
	);
	const blockName = `${ queryLoopName }/${ activeVariationName }`;
	const activeVariationPatterns = useSelect(
		( select ) => {
			if ( ! activeVariationName ) {
				return;
			}
			const {
				getBlockRootClientId,
				__experimentalGetPatternsByBlockTypes,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			return __experimentalGetPatternsByBlockTypes(
				blockName,
				rootClientId
			);
		},
		[ clientId, activeVariationName ]
	);
	return activeVariationPatterns?.length ? blockName : queryLoopName;
}
