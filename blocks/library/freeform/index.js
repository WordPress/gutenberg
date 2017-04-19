/**
 * Internal dependencies
 */
import { registerBlock, query, setUnknownTypeHandler } from 'api';

const { html } = query;

const blockSettings = {
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
};

registerBlock( 'core/freeform', blockSettings );
setUnknownTypeHandler( 'core/freeform' );
