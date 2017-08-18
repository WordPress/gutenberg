/**
 * External dependencies
 */
import Vue from 'vue/dist/vue';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { registerBlockType, source } from '../../api';

const { text } = source;

registerBlockType( 'core/vue-banner', {
	title: __( 'Vue Banner' ),

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

	edit( { attributes, setAttributes, target } ) {
		if ( target.firstChild ) {
			Object.assign( target.firstChild.__vue__, attributes );
			return;
		}

		const child = document.createElement( 'div' );
		target.appendChild( child );

		new Vue( {
			el: target.firstChild,

			data: () => ( { ...attributes } ),

			template: `
				<div>
					<input :value="text" @input="setText( $event.target.value )">
					<h1>{{ text }}</h1>
				</div>
			`,

			methods: {
				setText( nextText ) {
					setAttributes( { text: nextText } );
				},
			},
		} );
	},

	save( { attributes, target } ) {
		const child = document.createElement( 'div' );
		target.appendChild( child );

		new Vue( {
			el: target.firstChild,

			data: () => ( { ...attributes } ),

			template: `
				<h1>{{ text }}</h1>
			`,
		} );
	},
} );
