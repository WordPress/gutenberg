/**
 * Internal dependencies
 */
import { bold } from './bold';
import { code } from './code';
import { image } from './image';
import { italic } from './italic';
import { link } from './link';
import { strikethrough } from './strikethrough';
import { underline } from './underline';

/**
 * WordPress dependencies
 */
import {
	registerFormatType,
} from '@wordpress/rich-text';

[
	bold,
	code,
	image,
	italic,
	link,
	strikethrough,
	underline,
].forEach( ( { name, ...settings } ) => registerFormatType( name, settings ) );
