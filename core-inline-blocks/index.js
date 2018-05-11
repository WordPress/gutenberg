/**
 * WordPress dependencies
 */
import { registerInlineBlockType } from '../inline-blocks';

/**
 * Internal dependencies
 */
import * as inlineImage from './inline-image';

export const registerCoreInlineBlocks = () => {
	[
		inlineImage,
	].forEach( ( { name, settings } ) => {
		registerInlineBlockType( name, settings );
	} );
};
