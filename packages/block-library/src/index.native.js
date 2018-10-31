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
import * as heading from './heading';
import * as more from './more';
import * as paragraph from './paragraph';
import * as image from './image';
import * as nextpage from './nextpage';
import * as quote from './quote';

export const registerCoreBlocks = () => {
	[
		paragraph,
		heading,
		code,
		more,
		image,
		nextpage,
		quote,
	].forEach( ( { name, settings } ) => {
		registerBlockType( name, settings );
	} );
};
