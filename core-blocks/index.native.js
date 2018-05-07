/**
 * WordPress dependencies
 */
import {
	registerBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import * as code from './code';

export const registerCoreBlocks = () => {
	[
		code,
	].forEach( ( { name, settings } ) => {
		registerBlockType( name, settings );
	} );
};
