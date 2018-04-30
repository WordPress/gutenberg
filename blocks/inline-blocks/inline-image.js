/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default {
	id: 'inline-image',
	title: __( 'Inline Image' ),
	type: 'image',
	icon: 'format-image',
	render( { url, alt, width }, editor ) {
		const imgWidth = width > 150 ? 150 : width;
		const img = `<img style="width:${ imgWidth }px;" src="${ url }" alt="${ alt }" />`;

		editor.insertContent( img );
	},
};
