/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { loop as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';
import variations from './variations';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Query', 'block title' ),
	icon,
	description: __( 'Displays a list of posts as a result of a query.' ),
	edit,
	save,
	variations,
	deprecated,
};
