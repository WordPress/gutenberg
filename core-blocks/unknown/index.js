/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import UnknownBlockWarning from './unknown-block-warning';
import './editor.scss';

export const name = 'core/unknown';

export const settings = {
	name,
	category: 'common',
	title: __( 'Missing Block' ),

	supports: {
		inserter: false,
		html: false,
		preserveOriginalContent: true,
	},

	attributes: {},

	edit: UnknownBlockWarning,
	save: () => '',
};
