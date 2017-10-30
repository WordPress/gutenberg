/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import AuthorBlock from './block';
import { registerBlockType } from '../../api';

registerBlockType( 'core/author', {
	title: __( 'Author' ),

	icon: 'admin-users',

	category: 'widgets',

	supports: {
		html: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( [ 'wide', 'full', 'left', 'right' ].indexOf( align ) !== -1 ) {
			return { 'data-align': align };
		}
	},

	edit: AuthorBlock,

	save() {
		return null;
	},
} );
