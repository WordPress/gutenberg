/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	createBlock,
	registerBlockType
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';

registerBlockType( 'core/separator', {
	title: __( 'Separator' ),

	description: __( 'Use the separator to indicate a thematic change in the content.' ),

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