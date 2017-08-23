/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { registerBlockType, source } from '../../api';

const { text } = source;

registerBlockType( 'core/vanilla-banner', {
	title: __( 'Vanilla Banner' ),

	icon: 'marker',

	category: 'widgets',

	attributes: {
		text: {
			type: 'string',
			source: text( 'h1' ),
			default: 'Hello World',
		},
	},

	className: false,

	edit( { attributes, setAttributes } ) {
		return [ 'div',
			[ 'input', {
				value: attributes.text,
				onChange( event ) {
					setAttributes( {
						text: event.target.value,
					} );
				},
			} ],
			[ 'h1', attributes.text ],
		];
	},

	save( { attributes } ) {
		return [ 'h1', attributes.text ];
	},
} );
