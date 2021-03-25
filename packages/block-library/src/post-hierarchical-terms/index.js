/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import variations from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Post Hierarchical Terms', 'block title' ),
	variations,
	edit,
};
