/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import MissingBlockWarning from './missing-block-warning';
import './editor.scss';

export const name = 'core/missing';

export const settings = {
	name,
	category: 'common',
	title: __( 'Missing Block' ),

	supports: {
		className: false,
		customClassName: false,
		inserter: false,
		html: false,
		preserveOriginalContent: true,
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

	edit: MissingBlockWarning,
	save( { attributes } ) {
		// Preserve the missing block's content.
		return <RawHTML>{ attributes.originalContent }</RawHTML>;
	},
};
