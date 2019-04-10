/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import icon from './icon';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Reusable Template' ),

	description: __( 'Template block used as a container.' ),

	icon,

	supports: {
		customClassName: false,
		html: false,
		inserter: false,
	},

	edit() {
		return <InnerBlocks />;
	},

	save() {
		return <InnerBlocks.Content />;
	},
};
