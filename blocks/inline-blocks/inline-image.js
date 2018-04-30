/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default {
	id: 'inline-image',
	title: __( 'Inline Image' ),
	type: 'image',
	icon: 'format-image',
	render( { id, url, alt, width }, editor ) {
		const imgWidth = width > 150 ? 150 : width;
		// set width in style attribute to prevent Block CSS from overriding it
		const img = `<img class="wp-image-${ id }" style="width:${ imgWidth }px;" src="${ url }" alt="${ alt }" />`;

		editor.insertContent( img );
	},
};
