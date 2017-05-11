/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from '../../api';

import Button from 'components/button';
import Placeholder from 'components/placeholder';

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

		const canned = [
			{ src: 'https://lorempixel.com/240/180', alt: '240x180' },
			{ src: 'https://lorempixel.com/244/183', alt: '244x183' },
			{ src: 'https://lorempixel.com/248/186', alt: '248x186' },
			{ src: 'https://lorempixel.com/252/189', alt: '252x189' },
			{ src: 'https://lorempixel.com/256/192', alt: '256x192' },
			{ src: 'https://lorempixel.com/260/195', alt: '260x195' },
			{ src: 'https://lorempixel.com/264/198', alt: '264x198' },
			{ src: 'https://lorempixel.com/268/201', alt: '268x201' },
		];

		if ( ! images ) {
			return (
				<Placeholder
					instructions={ wp.i18n.__( 'Drag images here or insert from media library' ) }
					icon="format-gallery"
					label={ wp.i18n.__( 'Gallery' ) }
					className="blocks-gallery">
					<Button isLarge onClick={ () => setAttributes( { images: canned } ) }>
						{ wp.i18n.__( 'Insert from Media Library' ) }
					</Button>
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
