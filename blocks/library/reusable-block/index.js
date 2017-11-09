/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { registerBlockType } from '../../api';

registerBlockType( 'core/reusable-block', {
	title: __( 'Reusable Block' ),
	category: 'reusable-blocks',
	isPrivate: true,

	attributes: {
		ref: {
			type: 'string',
		},
	},

	edit: () => <div>{ __( 'Reusable Blocks are coming soon!' ) }</div>,
	save: () => null,
} );
