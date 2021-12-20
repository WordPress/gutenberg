/**
 * External dependencies
 */
import { castArray, isFunction, isPlainObject, omit, pick, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { isValidIcon, normalizeIconObject } from '../api/utils';
import { DEPRECATED_ENTRY_KEYS } from '../api/constants';

/** @typedef {import('../api/registration').WPBlockVariation} WPBlockVariation */

const { error, warn } = window.console;

/**
 * Mapping of legacy category slugs to their latest normal values, used to
 * accommodate updates of the default set of block categories.
 *
 * @type {Record<string,string>}
 */
const LEGACY_CATEGORY_MAPPING = {
	common: 'text',
	formatting: 'text',
	layout: 'design',
};

/**
 * Takes the unprocessed block type data and applies all the existing filters for the registered block type.
 * Next, it validates all the settings and performs additional processing to the block type definition.
 *
 * @param {WPBlockType} blockType        Unprocessed block type settings.
 * @param {Object}      thunkArgs        Argument object for the thunk middleware.
 * @param {Function}    thunkArgs.select Function to select from the store.
 *
 * @return {?WPBlockType} The block, if it has been successfully registered; otherwise `undefined`.
 */
const processBlockType = ( blockType, { select } ) => {
	const { name } = blockType;

	const settings = applyFilters(
		'blocks.registerBlockType',
		{ ...blockType },
		name
	);

	if ( settings.deprecated ) {
		settings.deprecated = settings.deprecated.map( ( deprecation ) =>
			pick(
				// Only keep valid deprecation keys.
				applyFilters(
					'blocks.registerBlockType',
					// Merge deprecation keys with pre-filter settings
					// so that filters that depend on specific keys being
					// present don't fail.
					{
						// Omit deprecation keys here so that deprecations
						// can opt out of specific keys like "supports".
						...omit( blockType, DEPRECATED_ENTRY_KEYS ),
						...deprecation,
					},
					name
				),
				DEPRECATED_ENTRY_KEYS
			)
		);
	}

	if ( ! isPlainObject( settings ) ) {
		error( 'Block settings must be a valid object.' );
		return;
	}

	if ( ! isFunction( settings.save ) ) {
		error( 'The "save" property must be a valid function.' );
		return;
	}
	if ( 'edit' in settings && ! isFunction( settings.edit ) ) {
		error( 'The "edit" property must be a valid function.' );
		return;
	}

	// Canonicalize legacy categories to equivalent fallback.
	if ( LEGACY_CATEGORY_MAPPING.hasOwnProperty( settings.category ) ) {
		settings.category = LEGACY_CATEGORY_MAPPING[ settings.category ];
	}

	if (
		'category' in settings &&
		! some( select.getCategories(), {
			slug: settings.category,
		} )
	) {
		warn(
			'The block "' +
				name +
				'" is registered with an invalid category "' +
				settings.category +
				'".'
		);
		delete settings.category;
	}

	if ( ! ( 'title' in settings ) || settings.title === '' ) {
		error( 'The block "' + name + '" must have a title.' );
		return;
	}
	if ( typeof settings.title !== 'string' ) {
		error( 'Block titles must be strings.' );
		return;
	}

	settings.icon = normalizeIconObject( settings.icon );
	if ( ! isValidIcon( settings.icon.src ) ) {
		error(
			'The icon passed is invalid. ' +
				'The icon should be a string, an element, a function, or an object following the specifications documented in https://developer.wordpress.org/block-editor/developers/block-api/block-registration/#icon-optional'
		);
		return;
	}

	return settings;
};

/**
 * Returns an action object used in signalling that block types have been added.
 *
 * @param {Array|Object} blockTypes Block types received.
 *
 * @return {Object} Action object.
 */
export function addBlockTypes( blockTypes ) {
	return {
		type: 'ADD_BLOCK_TYPES',
		blockTypes: castArray( blockTypes ),
	};
}

/**
 * Signals that the passed block type's settings should be stored in the state.
 *
 * @param {WPBlockType} blockType Unprocessed block type settings.
 */
export const __experimentalRegisterBlockType = ( blockType ) => ( {
	dispatch,
	select,
} ) => {
	dispatch( {
		type: 'ADD_UNPROCESSED_BLOCK_TYPE',
		blockType,
	} );

	const processedBlockType = processBlockType( blockType, { select } );
	if ( ! processedBlockType ) {
		return;
	}
	dispatch.addBlockTypes( processedBlockType );
};

/**
 * Signals that all block types should be computed again.
 * It uses stored unprocessed block types and all the most recent list of registered filters.
 *
 * It addresses the issue where third party block filters get registered after third party blocks. A sample sequence:
 *   1. Filter A.
 *   2. Block B.
 *   3. Block C.
 *   4. Filter D.
 *   5. Filter E.
 *   6. Block F.
 *   7. Filter G.
 * In this scenario some filters would not get applied for all blocks because they are registered too late.
 */
export const __experimentalReapplyBlockTypeFilters = () => ( {
	dispatch,
	select,
} ) => {
	const unprocessedBlockTypes = select.__experimentalGetUnprocessedBlockTypes();

	const processedBlockTypes = Object.keys( unprocessedBlockTypes ).reduce(
		( accumulator, blockName ) => {
			const result = processBlockType(
				unprocessedBlockTypes[ blockName ],
				{ select }
			);
			if ( result ) {
				accumulator.push( result );
			}
			return accumulator;
		},
		[]
	);

	if ( ! processedBlockTypes.length ) {
		return;
	}

	dispatch.addBlockTypes( processedBlockTypes );
};

/**
 * Returns an action object used to remove a registered block type.
 *
 * @param {string|Array} names Block name.
 *
 * @return {Object} Action object.
 */
export function removeBlockTypes( names ) {
	return {
		type: 'REMOVE_BLOCK_TYPES',
		names: castArray( names ),
	};
}

/**
 * Returns an action object used in signalling that new block styles have been added.
 *
 * @param {string}       blockName Block name.
 * @param {Array|Object} styles    Block styles.
 *
 * @return {Object} Action object.
 */
export function addBlockStyles( blockName, styles ) {
	return {
		type: 'ADD_BLOCK_STYLES',
		styles: castArray( styles ),
		blockName,
	};
}

/**
 * Returns an action object used in signalling that block styles have been removed.
 *
 * @param {string}       blockName  Block name.
 * @param {Array|string} styleNames Block style names.
 *
 * @return {Object} Action object.
 */
export function removeBlockStyles( blockName, styleNames ) {
	return {
		type: 'REMOVE_BLOCK_STYLES',
		styleNames: castArray( styleNames ),
		blockName,
	};
}

/**
 * Returns an action object used in signalling that new block variations have been added.
 *
 * @param {string}                              blockName  Block name.
 * @param {WPBlockVariation|WPBlockVariation[]} variations Block variations.
 *
 * @return {Object} Action object.
 */
export function addBlockVariations( blockName, variations ) {
	return {
		type: 'ADD_BLOCK_VARIATIONS',
		variations: castArray( variations ),
		blockName,
	};
}

/**
 * Returns an action object used in signalling that block variations have been removed.
 *
 * @param {string}          blockName      Block name.
 * @param {string|string[]} variationNames Block variation names.
 *
 * @return {Object} Action object.
 */
export function removeBlockVariations( blockName, variationNames ) {
	return {
		type: 'REMOVE_BLOCK_VARIATIONS',
		variationNames: castArray( variationNames ),
		blockName,
	};
}

/**
 * Returns an action object used to set the default block name.
 *
 * @param {string} name Block name.
 *
 * @return {Object} Action object.
 */
export function setDefaultBlockName( name ) {
	return {
		type: 'SET_DEFAULT_BLOCK_NAME',
		name,
	};
}

/**
 * Returns an action object used to set the name of the block used as a fallback
 * for non-block content.
 *
 * @param {string} name Block name.
 *
 * @return {Object} Action object.
 */
export function setFreeformFallbackBlockName( name ) {
	return {
		type: 'SET_FREEFORM_FALLBACK_BLOCK_NAME',
		name,
	};
}

/**
 * Returns an action object used to set the name of the block used as a fallback
 * for unregistered blocks.
 *
 * @param {string} name Block name.
 *
 * @return {Object} Action object.
 */
export function setUnregisteredFallbackBlockName( name ) {
	return {
		type: 'SET_UNREGISTERED_FALLBACK_BLOCK_NAME',
		name,
	};
}

/**
 * Returns an action object used to set the name of the block used
 * when grouping other blocks
 * eg: in "Group/Ungroup" interactions
 *
 * @param {string} name Block name.
 *
 * @return {Object} Action object.
 */
export function setGroupingBlockName( name ) {
	return {
		type: 'SET_GROUPING_BLOCK_NAME',
		name,
	};
}

/**
 * Returns an action object used to set block categories.
 *
 * @param {Object[]} categories Block categories.
 *
 * @return {Object} Action object.
 */
export function setCategories( categories ) {
	return {
		type: 'SET_CATEGORIES',
		categories,
	};
}

/**
 * Returns an action object used to update a category.
 *
 * @param {string} slug     Block category slug.
 * @param {Object} category Object containing the category properties that should be updated.
 *
 * @return {Object} Action object.
 */
export function updateCategory( slug, category ) {
	return {
		type: 'UPDATE_CATEGORY',
		slug,
		category,
	};
}

/**
 * Returns an action object used to add block collections
 *
 * @param {string} namespace The namespace of the blocks to put in the collection
 * @param {string} title     The title to display in the block inserter
 * @param {Object} icon      (optional) The icon to display in the block inserter
 *
 * @return {Object} Action object.
 */
export function addBlockCollection( namespace, title, icon ) {
	return {
		type: 'ADD_BLOCK_COLLECTION',
		namespace,
		title,
		icon,
	};
}

/**
 * Returns an action object used to remove block collections
 *
 * @param {string} namespace The namespace of the blocks to put in the collection
 *
 * @return {Object} Action object.
 */
export function removeBlockCollection( namespace ) {
	return {
		type: 'REMOVE_BLOCK_COLLECTION',
		namespace,
	};
}
