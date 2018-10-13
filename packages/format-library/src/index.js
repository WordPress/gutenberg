import { bold } from './bold';
import { code } from './code';
import { image } from './image';
import { italic } from './italic';
import { link } from './link';
import { strikethrough } from './strikethrough';

/**
 * WordPress dependencies
 */
import {
	registerFormatType,
} from '@wordpress/rich-text';

export const registerCoreFormats = () => {
	[
		bold,
		code,
		image,
		italic,
		link,
		strikethrough,
	].forEach( registerFormatType );
};

