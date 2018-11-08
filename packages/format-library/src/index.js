/**
 * WordPress dependencies
 */
import {
	registerFormatType,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { bold } from './bold';
import { code } from './code';
import { image } from './image';
import { italic } from './italic';
import { link } from './link';
import { strikethrough } from './strikethrough';

export function getCoreFormatTypes() {
	return [
		bold,
		code,
		image,
		italic,
		link,
		strikethrough,
	].map(
		( { name, ...settings } ) => [ name, settings ]
	);
}

export function registerCoreFormatTypes() {
	getCoreFormatTypes().forEach(
		( params ) => registerFormatType( ...params )
	);
}
