/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createMediaFromFile } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import { registerBlockType, createBlock } from '../../api';
import ImageBlock from './block';

registerBlockType( 'core/image', {
	title: __( 'Image' ),

	description: __( 'Worth a thousand words.' ),

	icon: 'format-image',

	category: 'common',

	keywords: [ __( 'photo' ) ],

	attributes: {
		url: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'src',
		},
		alt: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'alt',
		},
		caption: {
			type: 'array',
			source: 'children',
			selector: 'figcaption',
		},
		href: {
			type: 'string',
			source: 'attribute',
			selector: 'a',
			attribute: 'href',
		},
		id: {
			type: 'number',
		},
		align: {
			type: 'string',
		},
		width: {
			type: 'number',
		},
		height: {
			type: 'number',
		},
	},

	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: ( node ) => {
					const tag = node.nodeName.toLowerCase();
					const hasText = !! node.textContent.trim();
					const hasImage = node.querySelector( 'img' );

					return tag === 'img' || ( hasImage && ! hasText ) || ( hasImage && tag === 'figure' );
				},
			},
			{
				type: 'files',
				isMatch( files ) {
					return files.length === 1 && files[ 0 ].type.indexOf( 'image/' ) === 0;
				},
				transform( files ) {
					return createMediaFromFile( files[ 0 ] )
						.then( ( media ) => createBlock( 'core/image', {
							id: media.id,
							url: media.source_url,
						} ) );
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
						type: 'array',
						// To do: needs to support HTML.
						source: 'text',
					},
					href: {
						type: 'string',
						source: 'attribute',
						attribute: 'href',
						selector: 'a',
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
	},

	getEditWrapperProps( attributes ) {
		const { align, width } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align, 'data-resized': !! width };
		}
	},

	edit: ImageBlock,

	save( { attributes } ) {
		const { url, alt, caption, align, href, width, height } = attributes;
		const extraImageProps = width || height ? { width, height } : {};
		const figureStyle = width ? { width } : {};
		const image = <img src={ url } alt={ alt } { ...extraImageProps } />;

		return (
			<figure className={ align ? `align${ align }` : null } style={ figureStyle }>
				{ href ? <a href={ href }>{ image }</a> : image }
				{ caption && caption.length > 0 && <figcaption>{ caption }</figcaption> }
			</figure>
		);
	},
} );
