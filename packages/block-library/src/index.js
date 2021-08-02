/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	setDefaultBlockName,
	setFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
	setGroupingBlockName,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import * as paragraph from './paragraph';
import * as image from './image';
import * as heading from './heading';
import * as quote from './quote';
import * as gallery from './gallery';
import * as list from './list';
import * as missing from './missing';
import * as group from './group';
import * as classic from './freeform';

/**
 * Function to register an individual block.
 *
 * @param {Object} block The block to be registered.
 *
 */
const registerBlock = ( block ) => {
	if ( ! block ) {
		return;
	}
	const { metadata, settings, name } = block;
	registerBlockType( { name, ...metadata }, settings );
};

/**
 * Function to get all the core blocks in an array.
 *
 * @example
 * ```js
 * import { __experimentalGetCoreBlocks } from '@wordpress/block-library';
 *
 * const coreBlocks = __experimentalGetCoreBlocks();
 * ```
 */
export const __experimentalGetCoreBlocks = () => [
	// Common blocks are grouped at the top to prioritize their display
	// in various contexts — like the inserter and auto-complete components.
	paragraph,
	image,
	heading,
	gallery,
	list,
	quote,

	// Register all remaining core blocks.
	group,
	window.wp && window.wp.oldEditor ? classic : null, // Only add the classic block in WP Context
	missing,
];

/**
 * Function to register core blocks provided by the block editor.
 *
 * @param {Array} blocks An optional array of the core blocks being registered.
 *
 * @example
 * ```js
 * import { registerCoreBlocks } from '@wordpress/block-library';
 *
 * registerCoreBlocks();
 * ```
 */
export const registerCoreBlocks = (
	blocks = __experimentalGetCoreBlocks()
) => {
	blocks.forEach( registerBlock );

	setDefaultBlockName( paragraph.name );
	if ( window.wp && window.wp.oldEditor ) {
		setFreeformContentHandlerName( classic.name );
	}
	setUnregisteredTypeHandlerName( missing.name );
	setGroupingBlockName( group.name );
};

/**
 * Function to register experimental core blocks depending on editor settings.
 */
export const __experimentalRegisterExperimentalCoreBlocks = () => {};
