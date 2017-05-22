/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from '../../api';

import Placeholder from 'components/placeholder';
import MediaUploadButton from '../../media-upload-button';

import GalleryImage from './gallery-image';

const { query } = hpq;

registerBlock( 'core/gallery', {
	title: wp.i18n.__( 'Gallery' ),
	icon: 'format-gallery',
	category: 'common',

	attributes: {
		images: query( 'div.blocks-gallery' ),
	},

	edit( { attributes, setAttributes } ) {
		const { images } = attributes;
		if ( ! images ) {
			const setMediaUrl = ( imgs ) => setAttributes( { images: imgs } );
			return (
				<Placeholder
					instructions={ wp.i18n.__( 'Drag images here or insert from media library' ) }
					icon="format-gallery"
					label={ wp.i18n.__( 'Gallery' ) }
					className="blocks-gallery">
					<MediaUploadButton
						onSelect={ setMediaUrl }
						type="image"
						auto-open
						multiple="true"
					>
						{ wp.i18n.__( 'Insert from Media Library' ) }
					</MediaUploadButton>
				</Placeholder>
			);
		}

		return (
			<div className="blocks-gallery-images">
				{ images.map( ( img, i ) => (
					<GalleryImage key={ i } img={ img } />
				) ) }
			</div>
		);
	},

	save( { attributes } ) {
		const { images } = attributes;

		return (
			<div className="blocks-gallery">
				{ images.map( ( img, i ) => (
					<GalleryImage key={ i } img={ img } />
				) ) }
			</div>
		);
	},

} );
