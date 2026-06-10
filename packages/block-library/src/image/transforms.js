/**
 * WordPress dependencies
 */
import { createBlobURL, isBlobURL } from '@wordpress/blob';
import { createBlock, getBlockAttributes } from '@wordpress/blocks';

export function stripFirstImage( attributes, { shortcode } ) {
	const { body } = document.implementation.createHTMLDocument( '' );

	body.innerHTML = shortcode.content;

	let nodeToRemove = body.querySelector( 'img' );

	// If an image has parents, find the topmost node to remove.
	while (
		nodeToRemove &&
		nodeToRemove.parentNode &&
		nodeToRemove.parentNode !== body
	) {
		nodeToRemove = nodeToRemove.parentNode;
	}

	if ( nodeToRemove ) {
		nodeToRemove.parentNode.removeChild( nodeToRemove );
	}

	return body.innerHTML.trim();
}

function getFirstAnchorAttributeFormHTML( html, attributeName ) {
	const { body } = document.implementation.createHTMLDocument( '' );

	body.innerHTML = html;

	const { firstElementChild } = body;

	if ( firstElementChild && firstElementChild.nodeName === 'A' ) {
		return firstElementChild.getAttribute( attributeName ) || undefined;
	}
}

const imageSchema = {
	img: {
		attributes: [ 'src', 'alt', 'title', 'width', 'height' ],
		classes: [
			'alignleft',
			'aligncenter',
			'alignright',
			'alignnone',
			/^wp-image-\d+$/,
		],
	},
};

// Normalise an `<img>` pixel dimension attribute to the `<value>px` form the
// Image block stores in its `width`/`height` attributes. Non-integer values
// (e.g. `50%`) are dropped because the attribute round-trips through inline
// styles that expect pixel units.
function parsePixelDimension( value ) {
	return value && /^\d+$/.test( value ) ? `${ value }px` : undefined;
}

const schema = ( { phrasingContentSchema } ) => ( {
	figure: {
		require: [ 'img' ],
		children: {
			...imageSchema,
			a: {
				attributes: [ 'href', 'rel', 'target' ],
				classes: [ '*' ],
				children: imageSchema,
			},
			figcaption: {
				children: phrasingContentSchema,
			},
		},
	},
} );

const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: ( node ) =>
				node.nodeName === 'FIGURE' && !! node.querySelector( 'img' ),
			schema,
			transform: ( node ) => {
				const img = node.querySelector( 'img' );
				// Search both figure and image classes. Alignment could be
				// set on either. ID is set on the image.
				const className = node.className + ' ' + img.className;
				const alignMatches =
					/(?:^|\s)align(left|center|right)(?:$|\s)/.exec(
						className
					);
				const anchor = node.id === '' ? undefined : node.id;
				const align = alignMatches ? alignMatches[ 1 ] : undefined;
				const idMatches = /(?:^|\s)wp-image-(\d+)(?:$|\s)/.exec(
					className
				);
				const id = idMatches ? Number( idMatches[ 1 ] ) : undefined;
				const anchorElement = node.querySelector( 'a' );
				const linkDestination =
					anchorElement && anchorElement.href ? 'custom' : undefined;
				const href =
					anchorElement && anchorElement.href
						? anchorElement.href
						: undefined;
				const rel =
					anchorElement && anchorElement.rel
						? anchorElement.rel
						: undefined;
				const linkClass =
					anchorElement && anchorElement.className
						? anchorElement.className
						: undefined;
				// Pin only one dimension and let the other follow the aspect
				// ratio via `auto`. Pinning both as fixed pixels stretches the
				// image when a theme caps the width while the height stays
				// fixed. So width sources use `height: 'auto'`; height-only
				// sources use `width: 'auto'`.
				const widthValue = parsePixelDimension(
					img.getAttribute( 'width' )
				);
				const heightValue = parsePixelDimension(
					img.getAttribute( 'height' )
				);
				// When both dimensions are declared, preserve the source's
				// shape via `aspectRatio` (mirroring the resize handle). CSS
				// `aspect-ratio` needs no fixed dimensions, so the image keeps
				// its proportions even when the `src` can't resolve to natural
				// dimensions (e.g. an empty or blob `src`) — without it the
				// `height: 'auto'` would collapse to `0`.
				// `parseInt` is `NaN` for an absent dimension and `0` for a
				// zero one (both falsy), so a bogus ratio is never stored.
				const widthNumber = parseInt( widthValue, 10 );
				const heightNumber = parseInt( heightValue, 10 );
				const aspectRatio =
					widthNumber && heightNumber
						? String( widthNumber / heightNumber )
						: undefined;
				// A height-only source declares a single dimension, so it can't
				// carry an aspect ratio: `width: 'auto'` is capped by
				// `max-width: 100%` while the fixed height can still stretch a
				// wide source. This is a known edge case (a panoramic image
				// pinned by height only) left unsolved here.
				const width =
					widthValue || ( heightValue ? 'auto' : undefined );
				const height = widthValue ? 'auto' : heightValue;
				const attributes = getBlockAttributes(
					'core/image',
					node.outerHTML,
					{
						align,
						id,
						linkDestination,
						href,
						rel,
						linkClass,
						anchor,
						width,
						height,
						aspectRatio,
					}
				);

				if ( isBlobURL( attributes.url ) ) {
					attributes.blob = attributes.url;
					delete attributes.url;
				}

				return createBlock( 'core/image', attributes );
			},
		},
		{
			// Note: when dragging and dropping multiple files onto a gallery this overrides the
			// gallery transform in order to add new images to the gallery instead of
			// creating a new gallery.
			type: 'files',
			isMatch( files ) {
				return files.every(
					( file ) => file.type.indexOf( 'image/' ) === 0
				);
			},
			transform( files ) {
				const blocks = files.map( ( file ) => {
					return createBlock( 'core/image', {
						blob: createBlobURL( file ),
					} );
				} );
				return blocks;
			},
		},
		{
			type: 'shortcode',
			tag: 'caption',
			attributes: {
				url: {
					type: 'string',
					source: 'attribute',
					attribute: 'src',
					selector: 'img',
				},
				alt: {
					type: 'string',
					source: 'attribute',
					attribute: 'alt',
					selector: 'img',
				},
				caption: {
					shortcode: stripFirstImage,
				},
				href: {
					shortcode: ( attributes, { shortcode } ) => {
						return getFirstAnchorAttributeFormHTML(
							shortcode.content,
							'href'
						);
					},
				},
				rel: {
					shortcode: ( attributes, { shortcode } ) => {
						return getFirstAnchorAttributeFormHTML(
							shortcode.content,
							'rel'
						);
					},
				},
				linkClass: {
					shortcode: ( attributes, { shortcode } ) => {
						return getFirstAnchorAttributeFormHTML(
							shortcode.content,
							'class'
						);
					},
				},
				id: {
					type: 'number',
					shortcode: ( { named: { id } } ) => {
						if ( ! id ) {
							return;
						}

						return parseInt( id.replace( 'attachment_', '' ), 10 );
					},
				},
				align: {
					type: 'string',
					shortcode: ( { named: { align = 'alignnone' } } ) => {
						return align.replace( 'align', '' );
					},
				},
			},
		},
	],
};

export default transforms;
