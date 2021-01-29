/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import variations from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x(
		'Posts Navigation Link',
		'name of the block that displays the next or previous post link that is adjacent to the current post'
	),
	description: __(
		'Displays the next or previous post link that is adjacent to the current post.'
	),
	edit,
	variations,
};
