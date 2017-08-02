/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType } from '../../api';

registerBlockType( 'core/separator', {
	title: __( 'Separator' ),

	icon: 'minus',

	category: 'layout',

	keywords: [ __( 'horizontal-line' ), 'hr', __( 'divider' ) ],

	transforms: {
		from: [
			{
				type: 'pattern',
				trigger: 'enter',
				regExp: /^-{3,}$/,
				transform: () => ( { name: 'core/separator', attributes: {} } ),
			},
		],
	},

	edit( { className } ) {
		return <hr className={ className } />;
	},

	save() {
		return <hr />;
	},
} );
