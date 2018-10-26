/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaUpload from '../../../media-upload';

export const name = 'core/image';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

export const settings = {
	id: 'image',

	title: __( 'Inline Image' ),

	type: 'image',

	icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 16h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2zM4 5h10v9H4V5zm14 9v2h4v-2h-4zM2 20h20v-2H2v2zm6.4-8.8L7 9.4 5 12h8l-2.6-3.4-2 2.6z" /></svg>,

	edit( { onSave } ) {
		return (
			<MediaUpload
				allowedTypes={ ALLOWED_MEDIA_TYPES }
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
