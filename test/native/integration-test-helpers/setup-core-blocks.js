/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	setDefaultBlockName,
	unregisterBlockType,
} from '@wordpress/blocks';
import { coreBlocks, registerCoreBlocks } from '@wordpress/block-library';

/**
 * Registers all core blocks or a specific list of blocks before running tests.
 * Once the tests are run, all registered blocks are unregistered.
 *
 * @param {string[]} [blocks] Array of block names to be registered. If not provided, all core blocks will be registered.
 */
export const setupCoreBlocks = ( blocks ) => {
	beforeAll( () => {
		if ( blocks ) {
			blocks.forEach( ( blockName ) => coreBlocks[ blockName ].init() );

			// Paragraph block should always be registered as it's
			// the default block.
			const paragraphBlock = coreBlocks[ 'core/paragraph' ];
			if ( ! blocks.includes( paragraphBlock.name ) ) {
				paragraphBlock.init();
			}

			setDefaultBlockName( paragraphBlock.name );
		} else {
			// Register all core blocks
			registerCoreBlocks();
		}
	} );

	afterAll( () => {
		// Clean up registered blocks
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );
};
