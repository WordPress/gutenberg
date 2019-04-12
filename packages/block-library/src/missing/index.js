/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	name,
	title: __( 'Unrecognized Block' ),
	description: __( 'Your site doesn’t include support for this block.' ),

	supports: {
		className: false,
		customClassName: false,
		inserter: false,
		html: false,
		reusable: false,
	},

	edit,
	save( { attributes } ) {
		// Preserve the missing block's content.
		return <RawHTML>{ attributes.originalContent }</RawHTML>;
	},
};
