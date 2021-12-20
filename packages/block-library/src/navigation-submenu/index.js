/**
 * WordPress dependencies
 */
import { addSubmenu } from '@wordpress/icons';

/**
 * Internal dependencies
 */

import metadata from './block.json';
import edit from './edit';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: addSubmenu,

	__experimentalLabel: ( { label } ) => label,

	edit,

	save,

	transforms,
};
