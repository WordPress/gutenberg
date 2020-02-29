/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Surf' ),
	description: __( 'Add surf conditions.' ),
	edit,
	save: () => <span>Hello world!</span>,
	icon: <Dashicon icon="palmtree" />,
};