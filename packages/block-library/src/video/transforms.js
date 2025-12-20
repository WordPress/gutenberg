/**
 * WordPress dependencies
 */
import { createBlobURL, isBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';

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
};

export default transforms;
