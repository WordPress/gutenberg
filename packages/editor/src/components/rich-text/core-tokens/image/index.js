/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaUpload from '../../../media-upload';

export const name = 'core/image';

export const settings = {
	id: 'image',

	title: __( 'Inline Image' ),

	type: 'image',

	icon: <svg enableBackground="new 0 0 24 24" version="1.1" viewBox="0 0 24 24" xmlSpace="preserve"><path d="M18,13v2h3v-2H18z M3,19h18v-2H3V19z M5,15h9c1.1,0,2-0.9,2-2V7c0-1.1-0.9-2-2-2H5C3.9,5,3,5.9,3,7v6  C3,14.1,3.9,15,5,15z M5,7h9v6l-1.5-1.5c-0.3-0.3-0.7-0.5-1.1-0.5c-0.3,0-0.7,0.1-1,0.3l-1,1L5,8V7z M5,10.8L7.2,13H5V10.8z" /></svg>,

	edit( { onSave } ) {
		return (
			<MediaUpload
				type="image"
				onSelect={ ( media ) => onSave( media ) }
				onClose={ () => onSave( null ) }
				render={ ( { open } ) => {
					open();
					return null;
				} }
			/>
		);
	},

	save( { id, url, alt, width } ) {
		return (
			<img
				className={ `wp-image-${ id }` }
				// set width in style attribute to prevent Block CSS from overriding it
				style={ { width: `${ Math.min( width, 150 ) }px` } }
				src={ url }
				alt={ alt }
			/>
		);
	},
};
