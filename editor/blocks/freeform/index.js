const { html } = wp.blocks.query;

wp.blocks.registerBlock( 'core/freeform', {
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

wp.blocks.setUnknownTypeHandler( 'core/freeform' );
