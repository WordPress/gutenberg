/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';
import variations from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Query' ),
	description: __( 'Displays a list of posts as a result of a query.' ),
	edit,
	save,
	variations,
};

export { useQueryContext } from './edit';
