/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';
import transforms from './transforms';
import variations from './variations';
import deprecated from './deprecated';
import { embedContentIcon } from './icons';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Embed', 'block title' ),
	description: __(
		'Add a block that displays content pulled from other sites, like Twitter, Instagram or YouTube.'
	),
	icon: embedContentIcon,
	edit,
	save,
	transforms,
	variations,
	deprecated,
};
