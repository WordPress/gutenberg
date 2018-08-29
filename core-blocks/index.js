/**
 * WordPress dependencies
 */
import { registerCoreBlocks as registerBlockLibrary } from '@wordpress/block-library';
import deprecated from '@wordpress/deprecated';

export const registerCoreBlocks = ( ...args ) => {
	deprecated( 'wp.coreBlocks.registerCoreBlocks', {
		version: 3.8,
		alternative: 'wp.blockLibrary.registerCoreBlocks',
	} );

	return registerBlockLibrary( ...args );
};
