/**
 * WordPress dependencies
 */
import { createBlobURL, isBlobURL } from '@wordpress/blob';
import { createBlock, getBlockAttributes } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

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
		attributes: [ 'src', 'alt', 'title' ],
		classes: [
			'alignleft',
			'aligncenter',
			'alignright',
			'alignnone',
			/^wp-image-\d+$/,
		],
	},
};

const schema = ( { phrasingContentSchema } ) => ( {
	figure: {
		require: [ 'img' ],
		children: {
			...imageSchema,
			a: {
				attributes: [ 'href', 'rel', 'target' ],
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
				// Search both figure and image classes. Alignment could be
				// set on either. ID is set on the image.
				const className =
					node.className +
					' ' +
					node.querySelector( 'img' ).className;
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
				// The following check is intended to catch non-image files when dropped together with images.
				if (
					files.some(
						( file ) => file.type.indexOf( 'image/' ) === 0
					) &&
					files.some(
						( file ) => file.type.indexOf( 'image/' ) !== 0
					)
				) {
					const { createErrorNotice } = dispatch( noticesStore );
					createErrorNotice(
						__(
							'If uploading to a gallery all files need to be image formats'
						),
						{
							id: 'gallery-transform-invalid-file',
							type: 'snackbar',
						}
					);
				}
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
