/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import AuthorsBlock from './block';
import { registerBlockType } from '../../api';

registerBlockType( 'core/authors', {
	title: __( 'Authors' ),

	icon: 'admin-users',

	category: 'widgets',

	keywords: [ __( 'authors' ) ],

	supportHTML: false,

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( [ 'wide', 'full', 'left', 'right' ].indexOf( align ) !== -1 ) {
			return { 'data-align': align };
		}
	},

	edit: AuthorsBlock,

	save() {
		return null;
	},
} );
