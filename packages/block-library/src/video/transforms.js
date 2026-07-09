/**
 * WordPress dependencies
 */
import { createBlobURL, isBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getCarriedGifConversionAttributes,
	getConvertedGifAttachment,
} from '../utils/gif-conversion';
import { isGifVariation } from './variations';

const transforms = {
	from: [
		{
			type: 'files',
			isMatch( files ) {
				return (
					files.length === 1 &&
					files[ 0 ].type.indexOf( 'video/' ) === 0
				);
			},
			transform( files ) {
				const file = files[ 0 ];
				// We don't need to upload the media directly here
				// It's already done as part of the `componentDidMount`
				// in the video block
				const block = createBlock( 'core/video', {
					blob: createBlobURL( file ),
				} );
				return block;
			},
		},
		{
			type: 'shortcode',
			tag: 'video',
			attributes: {
				src: {
					type: 'string',
					shortcode: ( {
						named: { src, mp4, m4v, webm, ogv, flv },
					} ) => {
						return src || mp4 || m4v || webm || ogv || flv;
					},
				},
				poster: {
					type: 'string',
					shortcode: ( { named: { poster } } ) => {
						return poster;
					},
				},
				loop: {
					type: 'string',
					shortcode: ( { named: { loop } } ) => {
						return loop;
					},
				},
				autoplay: {
					type: 'string',
					shortcode: ( { named: { autoplay } } ) => {
						return autoplay;
					},
				},
				preload: {
					type: 'string',
					shortcode: ( { named: { preload } } ) => {
						return preload;
					},
				},
			},
		},
		{
			type: 'raw',
			isMatch: ( node ) =>
				node.nodeName === 'P' &&
				node.children.length === 1 &&
				node.firstChild.nodeName === 'VIDEO',
			transform: ( node ) => {
				const videoElement = node.firstChild;
				const attributes = {
					autoplay: videoElement.hasAttribute( 'autoplay' )
						? true
						: undefined,
					controls: videoElement.hasAttribute( 'controls' )
						? undefined
						: false,
					loop: videoElement.hasAttribute( 'loop' )
						? true
						: undefined,
					muted: videoElement.hasAttribute( 'muted' )
						? true
						: undefined,
					preload:
						videoElement.getAttribute( 'preload' ) || undefined,
					playsInline: videoElement.hasAttribute( 'playsinline' )
						? true
						: undefined,
					poster: videoElement.getAttribute( 'poster' ) || undefined,
					src: videoElement.getAttribute( 'src' ) || undefined,
				};
				if ( isBlobURL( attributes.src ) ) {
					attributes.blob = attributes.src;
					delete attributes.src;
				}
				return createBlock( 'core/video', attributes );
			},
		},
	],
	to: [
		{
			// Offer switching a GIF-behaving video created from an uploaded
			// animated GIF back to an Image block showing the original GIF.
			// The converted video keeps the GIF image attachment as its `id`,
			// so an image mime type on the attachment is what distinguishes
			// it from a regular video that merely loops and autoplays.
			type: 'block',
			blocks: [ 'core/image' ],
			isMatch: ( attributes ) =>
				isGifVariation( attributes ) &&
				!! getConvertedGifAttachment( attributes.id ),
			transform( attributes ) {
				const { id, caption } = attributes;
				const gif = getConvertedGifAttachment( id );

				return createBlock( 'core/image', {
					...getCarriedGifConversionAttributes( attributes ),
					id,
					url: gif.source_url,
					alt: gif.alt_text || '',
					caption,
				} );
			},
		},
	],
};

export default transforms;
