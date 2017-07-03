/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './block.scss';
import { registerBlockType, createBlock } from '../../api';

registerBlockType( 'core/separator', {
	title: __( 'Separator' ),

	icon: 'minus',

	category: 'layout',

	transforms: {
		from: [
			{
				type: 'pattern',
				regExp: /^-{3,}$/,
				transform: () => createBlock( 'core/separator' ),
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
