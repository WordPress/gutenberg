/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { registerBlockType } from '../../api';

registerBlockType( 'core/style', {
	title: __( 'Style' ),

	icon: 'editor-code',

	category: 'hidden',

	attributes: {
		content: {
			type: 'string',
			source: 'html',
		},
	},

	isComputedBlock: true,

	supportHTML: true,

	edit( ) {
		return [];
	},

	save( { attributes } ) {
		return `<style type="text/css">${ attributes.content }</style>\n`;
	},
} );
