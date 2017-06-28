/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType } from '../../api';

registerBlockType( 'core/separator', {
	title: __( 'Separator' ),

	icon: 'minus',

	category: 'layout',

	edit( { className } ) {
		return <hr className={ className } />;
	},

	save() {
		return <hr />;
	},
} );
