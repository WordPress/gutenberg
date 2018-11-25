/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	createBlock,
	getBlockAttributes,
	getPhrasingContentSchema,
} from '@wordpress/blocks';
import { RichText } from '@wordpress/editor';
import { createBlobURL } from '@wordpress/blob';
import {
	Path,
	SVG,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';

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
		type: 'string',
		source: 'html',
		selector: 'figcaption',
	},
	href: {
		type: 'string',
		source: 'attribute',
		selector: 'figure > a',
		attribute: 'href',
	},
	rel: {
		type: 'string',
		source: 'attribute',
		selector: 'figure > a',
		attribute: 'rel',
	},
	linkClass: {
		type: 'string',
		source: 'attribute',
		selector: 'figure > a',
		attribute: 'class',
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
	linkDestination: {
		type: 'string',
		default: 'none',
	},
	linkTarget: {
		type: 'string',
		source: 'attribute',
		selector: 'figure > a',
		attribute: 'target',
	},
};

const imageSchema = {
	img: {
		attributes: [ 'src', 'alt' ],
		classes: [ 'alignleft', 'aligncenter', 'alignright', 'alignnone', /^wp-image-\d+$/ ],
	},
};

const schema = {
	figure: {
		require: [ 'img' ],
		children: {
			...imageSchema,
			a: {
				attributes: [ 'href', 'rel', 'target' ],
				children: imageSchema,
			},
			figcaption: {
				children: getPhrasingContentSchema(),
			},
		},
	},
};

export const settings = {
	title: __( 'Image' ),

	description: __( 'Insert an image to make a visual statement.' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path d="M0,0h24v24H0V0z" fill="none" /><Path d="m19 5v14h-14v-14h14m0-2h-14c-1.1 0-2 0.9-2 2v14c0 1.1 0.9 2 2 2h14c1.1 0 2-0.9 2-2v-14c0-1.1-0.9-2-2-2z" /><Path d="m14.14 11.86l-3 3.87-2.14-2.59-3 3.86h12l-3.86-5.14z" /></SVG>,

	category: 'common',

	keywords: [
		'img', // "img" is not translated as it is intended to reflect the HTML <img> tag.
		__( 'photo' ),
	],

	attributes: blockAttributes,

	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'FIGURE' && !! node.querySelector( 'img' ),
				schema,
				transform: ( node ) => {
					// Search both figure and image classes. Alignment could be
					// set on either. ID is set on the image.
					const className = node.className + ' ' + node.querySelector( 'img' ).className;
					const alignMatches = /(?:^|\s)align(left|center|right)(?:$|\s)/.exec( className );
					const align = alignMatches ? alignMatches[ 1 ] : undefined;
					const idMatches = /(?:^|\s)wp-image-(\d+)(?:$|\s)/.exec( className );
					const id = idMatches ? Number( idMatches[ 1 ] ) : undefined;
					const anchorElement = node.querySelector( 'a' );
					const linkDestination = anchorElement && anchorElement.href ? 'custom' : undefined;
					const href = anchorElement && anchorElement.href ? anchorElement.href : undefined;
					const rel = anchorElement && anchorElement.rel ? anchorElement.rel : undefined;
					const linkClass = anchorElement && anchorElement.className ? anchorElement.className : undefined;
					const attributes = getBlockAttributes( 'core/image', node.outerHTML, { align, id, linkDestination, href, rel, linkClass } );
					return createBlock( 'core/image', attributes );
				},
			},
			{
				type: 'files',
				isMatch( files ) {
					return files.length === 1 && files[ 0 ].type.indexOf( 'image/' ) === 0;
				},
				transform( files ) {
					const file = files[ 0 ];
					// We don't need to upload the media directly here
					// It's already done as part of the `componentDidMount`
					// int the image block
					const block = createBlock( 'core/image', {
						url: createBlobURL( file ),
					} );

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
						shortcode: ( attributes, { shortcode } ) => {
							const { content } = shortcode;
							return content.replace( /\s*<img[^>]*>\s/, '' );
						},
					},
					href: {
						type: 'string',
						source: 'attribute',
						attribute: 'href',
						selector: 'a',
					},
					rel: {
						type: 'string',
						source: 'attribute',
						attribute: 'rel',
						selector: 'a',
					},
					linkClass: {
						type: 'string',
						source: 'attribute',
						attribute: 'class',
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

	edit,

	save( { attributes } ) {
		const {
			url,
			alt,
			caption,
			align,
			href,
			rel,
			linkClass,
			width,
			height,
			id,
			linkTarget,
		} = attributes;

		const classes = classnames( {
			[ `align${ align }` ]: align,
			'is-resized': width || height,
		} );

		const image = (
			<img
				src={ url }
				alt={ alt }
				className={ id ? `wp-image-${ id }` : null }
				width={ width }
				height={ height }
			/>
		);

		const figure = (
			<Fragment>
				{ href ? (
					<a
						className={ linkClass }
						href={ href }
						target={ linkTarget }
						rel={ rel }
					>
						{ image }
					</a>
				) : image }
				{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
			</Fragment>
		);

		if ( 'left' === align || 'right' === align || 'center' === align ) {
			return (
				<div>
					<figure className={ classes }>
						{ figure }
					</figure>
				</div>
			);
		}

		return (
			<figure className={ classes }>
				{ figure }
			</figure>
		);
	},

	deprecated: [
		{
			attributes: blockAttributes,
			save( { attributes } ) {
				const { url, alt, caption, align, href, width, height, id } = attributes;

				const classes = classnames( {
					[ `align${ align }` ]: align,
					'is-resized': width || height,
				} );

				const image = (
					<img
						src={ url }
						alt={ alt }
						className={ id ? `wp-image-${ id }` : null }
						width={ width }
						height={ height }
					/>
				);

				return (
					<figure className={ classes }>
						{ href ? <a href={ href }>{ image }</a> : image }
						{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
					</figure>
				);
			},
		},
		{
			attributes: blockAttributes,
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

				return (
					<figure className={ align ? `align${ align }` : null } >
						{ href ? <a href={ href }>{ image }</a> : image }
						{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
					</figure>
				);
			},
		},
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
						{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
					</figure>
				);
			},
		},
	],
};
