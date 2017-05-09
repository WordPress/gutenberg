/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import { registerBlock, query, setUnknownTypeHandler } from '../../api';

const { html } = query;

registerBlock( 'core/freeform', {
	title: __( 'Freeform' ),

	icon: 'text',

	category: 'common',

	attributes: {
		html: html()
	},

	edit( { attributes } ) {
		return (
			<div
				contentEditable
				suppressContentEditableWarning
			>
				{ attributes.html }
			</div>
		);
	},

	save( { attributes } ) {
		return attributes.html;
	}
} );

setUnknownTypeHandler( 'core/freeform' );
