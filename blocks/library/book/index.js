/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { registerBlockType } from '../../api';

registerBlockType( 'core/book', {
	title: __( 'Book' ),

	icon: 'book',

	category: 'common',

	attributes: {
		author: {
			type: 'string',
			meta: 'author',
		},
	},

	edit( { attributes, setAttributes } ) {
		function onChange( event ) {
			setAttributes( { author: event.target.value } );
		}

		return (
			<input value={ attributes.author }
				onChange={ onChange } />
		);
	},

	save( { attributes } ) {
		return (
			<p>{ attributes.author }</p>
		);
	},
} );
