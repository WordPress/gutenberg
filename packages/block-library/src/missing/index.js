/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/missing';

export const settings = {
	name,
	category: 'common',
	title: __( 'Unrecognized Block' ),
	description: __( 'Your site doesn’t include support for this block.' ),

	supports: {
		className: false,
		customClassName: false,
		inserter: false,
		html: false,
		reusable: false,
	},

	attributes: {
		originalName: {
			type: 'string',
		},
		originalUndelimitedContent: {
			type: 'string',
		},
		originalContent: {
			type: 'string',
			source: 'html',
		},
	},

	edit,
	save( { attributes } ) {
		// Preserve the missing block's content.
		return <RawHTML>{ attributes.originalContent }</RawHTML>;
	},
};
