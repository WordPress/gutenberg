/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createMediaFromFile, preloadImage } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import { createBlock, getBlockAttributes, getBlockType } from '../../api';
import ImageBlock from './block';

export const name = 'core/image';

const blockAttributes = {
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
		default: '',
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
};

export const settings = {
	title: __( 'Image' ),

	description: __( 'Worth a thousand words.' ),

	icon: 'format-image',

	category: 'common',

	keywords: [ __( 'photo' ) ],

	attributes: blockAttributes,

	transforms: {
		from: [
			{
				type: 'raw',
				isMatch( node ) {
					const tag = node.nodeName.toLowerCase();
					const hasImage = node.querySelector( 'img' );

					return tag === 'img' || ( hasImage && tag === 'figure' );
				},
				transform( node ) {
					const matches = /align(left|center|right)/.exec( node.className );
					const align = matches ? matches[ 1 ] : undefined;
					const blockType = getBlockType( 'core/image' );
					const attributes = getBlockAttributes( blockType, node.outerHTML, { align } );
					return createBlock( 'core/image', attributes );
				},
			},
			{
				type: 'files',
				isMatch( files ) {
					return files.length === 1 && files[ 0 ].type.indexOf( 'image/' ) === 0;
				},
				transform( files, onChange ) {
					const file = files[ 0 ];
					const block = createBlock( 'core/image', {
						url: window.URL.createObjectURL( file ),
					} );

					createMediaFromFile( file )
						.then( ( media ) => preloadImage( media.source_url ).then(
							() => onChange( block.uid, { id: media.id, url: media.source_url } )
						) );

					return block;
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
		if ( 'left' === align || 'center' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align, 'data-resized': !! width };
		}
	},

	edit: ImageBlock,

	save( { attributes } ) {
		const { url, alt, caption, align, href, width, height, id } = attributes;

		const image = (
			<img
				src={ url }
				alt={ alt }
				className={ id ? `wp-image-${ id }` : null }
				width={ width }
				height={ height }
			/>
		);

		let figureStyle = {};

		if ( width ) {
			figureStyle = { width };
		} else if ( align === 'left' || align === 'right' ) {
			figureStyle = { maxWidth: '50%' };
		}

		return (
			<figure className={ align ? `align${ align }` : null } style={ figureStyle }>
				{ href ? <a href={ href }>{ image }</a> : image }
				{ caption && caption.length > 0 && <figcaption>{ caption }</figcaption> }
			</figure>
		);
	},

	deprecated: [
		{
			attributes: blockAttributes,
			save( { attributes } ) {
				const { url, alt, caption, align, href, width, height } = attributes;
				const extraImageProps = width || height ? { width, height } : {};
				const image = <img src={ url } alt={ alt } { ...extraImageProps } />;

				let figureStyle = {};

				if ( width ) {
					figureStyle = { width };
				} else if ( align === 'left' || align === 'right' ) {
					figureStyle = { maxWidth: '50%' };
				}

				return (
					<figure className={ align ? `align${ align }` : null } style={ figureStyle }>
						{ href ? <a href={ href }>{ image }</a> : image }
						{ caption && caption.length > 0 && <figcaption>{ caption }</figcaption> }
					</figure>
				);
			},
		},
	],
};
