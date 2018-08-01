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
import * as more from './more';
import * as paragraph from './paragraph';

export const registerCoreBlocks = () => {
	[
		paragraph,
		code,
		more,
	].forEach( ( { name, settings } ) => {
		registerBlockType( name, settings );
	} );
};
