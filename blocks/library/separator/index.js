/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, createBlock } from '../../api';

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
				transform: () => createBlock( 'core/separator' ),
			},
			{
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'HR',
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
