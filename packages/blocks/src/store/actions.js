/**
 * External dependencies
 */
import {
	castArray,
	keyBy,
	map,
	omit,
	mapValues,
	uniqBy,
	find,
	isEmpty,
} from 'lodash';

/**
 * Internal dependencies
 */
import {
	blockTypesByName,
	blockStylesByBlockName,
	blockVariationsByBlockName,
	defaultBlockName,
	freeformFallbackBlockName,
	unregisteredFallbackBlockName,
	groupingBlockName,
	blockCategories,
	blockCollections,
} from './atoms';

/** @typedef {import('../api/registration').WPBlockVariation} WPBlockVariation */

/**
 * Returns an action object used in signalling that block types have been added.
 *
 * @param {Array|Object} newBlockTypes Block types received.
 */
export const addBlockTypes = ( newBlockTypes ) => ( { get, set } ) => {
	newBlockTypes = castArray( newBlockTypes );
	const currentBlockTypes = get( blockTypesByName );
	set( blockTypesByName, {
		...currentBlockTypes,
		...keyBy(
			map( newBlockTypes, ( blockType ) => omit( blockType, 'styles ' ) ),
			'name'
		),
	} );

	const currentBlockStyles = get( blockStylesByBlockName );
	set( blockStylesByBlockName, {
		...currentBlockStyles,
		...mapValues( keyBy( newBlockTypes, 'name' ), ( blockType ) => {
			return uniqBy(
				[
					...( blockType.styles ?? [] ),
					...( currentBlockStyles[ blockType.name ] ?? [] ),
				],
				( style ) => style.name
			);
		} ),
	} );

	const currentBlockVariations = get( blockVariationsByBlockName );
	set( blockVariationsByBlockName, {
		...currentBlockVariations,
		...mapValues( keyBy( newBlockTypes, 'name' ), ( blockType ) => {
			return uniqBy(
				[
					...( blockType.variations ?? [] ),
					...( currentBlockVariations[ blockType.name ] ?? [] ),
				],
				( variation ) => variation.name
			);
		} ),
	} );
};

/**
 * Returns an action object used to remove a registered block type.
 *
 * @param {string|Array} names Block name.
 */
export const removeBlockTypes = ( names ) => ( { get, set } ) => {
	names = castArray( names );
	set( blockTypesByName, omit( get( blockTypesByName ), names ) );
	set( blockStylesByBlockName, omit( get( blockStylesByBlockName ), names ) );
	set(
		blockVariationsByBlockName,
		omit( get( blockVariationsByBlockName ), names )
	);
	[
		defaultBlockName,
		unregisteredFallbackBlockName,
		freeformFallbackBlockName,
		groupingBlockName,
	].forEach( ( atom ) => {
		const value = get( atom );
		if ( names.includes( value ) ) {
			set( atom, null );
		}
	} );
};

/**
 * Returns an action object used in signalling that new block styles have been added.
 *
 * @param {string}       blockName  Block name.
 * @param {Array|Object} styles     Block styles.
 */
export const addBlockStyles = ( blockName, styles ) => ( { get, set } ) => {
	const currentBlockStyles = get( blockStylesByBlockName );
	set( blockStylesByBlockName, {
		...currentBlockStyles,
		[ blockName ]: uniqBy(
			[
				...( currentBlockStyles[ blockName ] ?? [] ),
				...castArray( styles ),
			],
			( style ) => style.name
		),
	} );
};

/**
 * Returns an action object used in signalling that block styles have been removed.
 *
 * @param {string}       blockName  Block name.
 * @param {Array|string} styleNames Block style names.
 */
export const removeBlockStyles = ( blockName, styleNames ) => ( {
	get,
	set,
} ) => {
	const currentBlockStyles = get( blockStylesByBlockName );
	set( blockStylesByBlockName, {
		...currentBlockStyles,
		[ blockName ]: ( currentBlockStyles.blockName ?? [] ).filter(
			( style ) => castArray( styleNames ).indexOf( style.name ) === -1
		),
	} );
};

/**
 * Returns an action object used in signalling that new block variations have been added.
 *
 * @param {string}                              blockName  Block name.
 * @param {WPBlockVariation|WPBlockVariation[]} variations Block variations.
 */
export const addBlockVariations = ( blockName, variations ) => ( {
	get,
	set,
} ) => {
	const currentBlockVariations = get( blockVariationsByBlockName );
	set( blockVariationsByBlockName, {
		...currentBlockVariations,
		[ blockName ]: uniqBy(
			[
				...( currentBlockVariations[ blockName ] ?? [] ),
				...castArray( variations ),
			],
			( variation ) => variation.name
		),
	} );
};

/**
 * Returns an action object used in signalling that block variations have been removed.
 *
 * @param {string}          blockName      Block name.
 * @param {string|string[]} variationNames Block variation names.
 */
export const removeBlockVariations = ( blockName, variationNames ) => ( {
	get,
	set,
} ) => {
	const currentBlockVariations = get( blockVariationsByBlockName );
	set( blockVariationsByBlockName, {
		...currentBlockVariations,
		[ blockName ]: ( currentBlockVariations.blockName ?? [] ).filter(
			( variation ) =>
				castArray( variationNames ).indexOf( variation.name ) === -1
		),
	} );
};

/**
 * Returns an action object used to set the default block name.
 *
 * @param {string} name Block name.
 */
export const setDefaultBlockName = ( name ) => ( { set } ) => {
	set( defaultBlockName, name );
};

/**
 * Returns an action object used to set the name of the block used as a fallback
 * for non-block content.
 *
 * @param {string} name Block name.
 */
export const setFreeformFallbackBlockName = ( name ) => ( { set } ) => {
	set( freeformFallbackBlockName, name );
};

/**
 * Returns an action object used to set the name of the block used as a fallback
 * for unregistered blocks.
 *
 * @param {string} name Block name.
 */
export const setUnregisteredFallbackBlockName = ( name ) => ( { set } ) => {
	set( unregisteredFallbackBlockName, name );
};

/**
 * Returns an action object used to set the name of the block used
 * when grouping other blocks
 * eg: in "Group/Ungroup" interactions
 *
 * @param {string} name Block name.
 */
export const setGroupingBlockName = ( name ) => ( { set } ) => {
	set( groupingBlockName, name );
};

/**
 * Returns an action object used to set block categories.
 *
 * @param {Object[]} newCategories Block categories.
 * @return {Object} Action object.
 */
export const setCategories = ( newCategories ) => ( { set } ) => {
	set( blockCategories, newCategories || [] );
};

/**
 * Returns an action object used to update a category.
 *
 * @param {string} slug            Block category slug.
 * @param {Object} updatedCategory Object containing the category properties that should be updated.
 */
export const updateCategory = ( slug, updatedCategory ) => ( { get, set } ) => {
	if ( ! updatedCategory || isEmpty( updatedCategory ) ) {
		return;
	}
	const currentCategories = get( blockCategories );
	const categoryToChange = find( currentCategories, [ 'slug', slug ] );
	if ( categoryToChange ) {
		set(
			blockCategories,
			currentCategories.map( ( cat ) => {
				if ( cat.slug === slug ) {
					return {
						...cat,
						...updatedCategory,
					};
				}
				return cat;
			} )
		);
	}
};

/**
 * Returns an action object used to add block collections
 *
 * @param {string} namespace       The namespace of the blocks to put in the collection
 * @param {string} title           The title to display in the block inserter
 * @param {Object} icon (optional) The icon to display in the block inserter
 *
 */
export const addBlockCollection = ( namespace, title, icon ) => ( {
	get,
	set,
} ) => {
	set( blockCollections, {
		...get( blockCollections ),
		[ namespace ]: { title, icon },
	} );
};

/**
 * Returns an action object used to remove block collections
 *
 * @param {string} namespace       The namespace of the blocks to put in the collection
 */
export const removeBlockCollection = ( namespace ) => ( { get, set } ) => {
	set( blockCollections, omit( get( blockCollections ), namespace ) );
};
