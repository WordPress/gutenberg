/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * WordPress term object from REST API.
 * Categories ref: https://developer.wordpress.org/rest-api/reference/categories/
 * Tags ref: https://developer.wordpress.org/rest-api/reference/tags/
 *
 * @typedef {Object} WPTerm
 * @property {number} id          Unique identifier for the term.
 * @property {number} count       Number of published posts for the term.
 * @property {string} description HTML description of the term.
 * @property {string} link        URL of the term.
 * @property {string} name        HTML title for the term.
 * @property {string} slug        An alphanumeric identifier for the term unique to its type.
 * @property {string} taxonomy    Type attribution for the term.
 * @property {Object} meta        Meta fields
 * @property {number} [parent]    The parent term ID.
 */

/**
 * The object used in Query block that contains info and helper mappings
 * from an array of WPTerm.
 *
 * @typedef {Object} QueryTermsInfo
 * @property {WPTerm[]}               terms     The array of terms.
 * @property {Object<string, WPTerm>} mapById   Object mapping with the term id as key and the term as value.
 * @property {Object<string, WPTerm>} mapByName Object mapping with the term name as key and the term as value.
 * @property {string[]}               names     Array with the terms' names.
 */

/**
 * Returns a helper object with mapping from WPTerms.
 *
 * @param {WPTerm[]} terms The terms to extract of helper object.
 * @return {QueryTermsInfo} The object with the terms information.
 */
export const getTermsInfo = ( terms ) => ( {
	terms,
	...terms?.reduce(
		( accumulator, term ) => {
			const { mapById, mapByName, names } = accumulator;
			mapById[ term.id ] = term;
			mapByName[ term.name ] = term;
			names.push( term.name );
			return accumulator;
		},
		{ mapById: {}, mapByName: {}, names: [] }
	),
} );

/**
 * Returns a helper object that contains:
 * 1. An `options` object from the available post types, to be passed to a `SelectControl`.
 * 2. A helper map with available taxonomies per post type.
 *
 * @return {Object} The helper object related to post types.
 */
export const usePostTypes = () => {
	const { postTypes } = useSelect( ( select ) => {
		const { getPostTypes } = select( coreStore );
		const excludedPostTypes = [ 'attachment' ];
		const filteredPostTypes = getPostTypes( { per_page: -1 } )?.filter(
			( { viewable, slug } ) =>
				viewable && ! excludedPostTypes.includes( slug )
		);
		return {
			postTypes: filteredPostTypes,
		};
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
 * Recurses over a list of blocks and returns the first found
 * Query Loop block's clientId.
 *
 * @param {WPBlock[]} blocks The list of blocks to look through.
 * @return {string=} The first found Query Loop's clientId.
 */
export const getFirstQueryClientIdFromBlocks = ( blocks ) => {
	const blocksQueue = [ ...blocks ];
	while ( blocksQueue.length > 0 ) {
		const block = blocksQueue.shift();
		if ( block.name === 'core/query' ) {
			return block.clientId;
		}
		block.innerBlocks?.forEach( ( innerBlock ) => {
			blocksQueue.push( innerBlock );
		} );
	}
};
