/**
 * Internal dependencies
 */
import { registerBlock, query, setUnknownTypeHandler } from 'api';

const { html } = query;

registerBlock( 'core/freeform', {
	title: wp.i18n.__( 'Freeform' ),

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
