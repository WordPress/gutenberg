/**
 * Internal dependencies
 */
import { registerBlockType } from '../../api';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

registerBlockType( 'core/reusable-block', {
	title: __( 'Reusable Block' ),
	category: null,

	attributes: {
		ref: {
			type: 'string',
		},
	},

	edit: null,
	save: () => null,
} );
