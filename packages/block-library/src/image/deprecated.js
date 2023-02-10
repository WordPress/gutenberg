/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
} from '@wordpress/block-editor';

const blockAttributes = {
	align: {
		type: 'string',
	},
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
	title: {
		type: 'string',
		source: 'attribute',
		selector: 'img',
		attribute: 'title',
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
	width: {
		type: 'number',
	},
	height: {
		type: 'number',
	},
	sizeSlug: {
		type: 'string',
	},
	linkDestination: {
		type: 'string',
	},
	linkTarget: {
		type: 'string',
		source: 'attribute',
		selector: 'figure > a',
		attribute: 'target',
	},
};

const blockSupports = {
	anchor: true,
	color: {
		__experimentalDuotone: 'img',
		text: false,
		background: false,
	},
	__experimentalBorder: {
		radius: true,
		__experimentalDefaultControls: {
			radius: true,
		},
	},
};

const deprecated = [
	// Deprecate the version that does not use the caption to describe the image
	// when the image has a caption but no alt text.
	{
		attributes: {
			align: {
				type: 'string',
			},
			url: {
				type: 'string',
				source: 'attribute',
				selector: 'img',
				attribute: 'src',
				__experimentalRole: 'content',
			},
			alt: {
				type: 'string',
				source: 'attribute',
				selector: 'img',
				attribute: 'alt',
				default: '',
				__experimentalRole: 'content',
			},
			caption: {
				type: 'string',
				source: 'html',
				selector: 'figcaption',
				__experimentalRole: 'content',
			},
			title: {
				type: 'string',
				source: 'attribute',
				selector: 'img',
				attribute: 'title',
				__experimentalRole: 'content',
			},
			href: {
				type: 'string',
				source: 'attribute',
				selector: 'figure > a',
				attribute: 'href',
				__experimentalRole: 'content',
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
				__experimentalRole: 'content',
			},
			width: {
				type: 'number',
			},
			height: {
				type: 'number',
			},
			sizeSlug: {
				type: 'string',
			},
			linkDestination: {
				type: 'string',
			},
			linkTarget: {
				type: 'string',
				source: 'attribute',
				selector: 'figure > a',
				attribute: 'target',
			},
		},
		supports: {
			anchor: true,
			color: {
				__experimentalDuotone: 'img, .components-placeholder',
				text: false,
				background: false,
			},
			__experimentalBorder: {
				color: true,
				radius: true,
				width: true,
				__experimentalSelector: 'img, .wp-block-image__crop-area',
				__experimentalSkipSerialization: true,
				__experimentalDefaultControls: {
					color: true,
					radius: true,
					width: true,
				},
			},
		},
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
				sizeSlug,
				title,
			} = attributes;

			const newRel = isEmpty( rel ) ? undefined : rel;
			const borderProps = getBorderClassesAndStyles( attributes );

			const classes = classnames( {
				[ `align${ align }` ]: align,
				[ `size-${ sizeSlug }` ]: sizeSlug,
				'is-resized': width || height,
				'has-custom-border':
					!! borderProps.className || ! isEmpty( borderProps.style ),
			} );

			const imageClasses = classnames( borderProps.className, {
				[ `wp-image-${ id }` ]: !! id,
			} );

			const image = (
				<img
					src={ url }
					alt={ alt }
					className={ imageClasses || undefined }
					style={ borderProps.style }
					width={ width }
					height={ height }
					title={ title }
				/>
			);

			const figure = (
				<>
					{ href ? (
						<a
							className={ linkClass }
							href={ href }
							target={ linkTarget }
							rel={ newRel }
						>
							{ image }
						</a>
					) : (
						image
					) }
					{ ! RichText.isEmpty( caption ) && (
						<RichText.Content
							className={ __experimentalGetElementClassName(
								'caption'
							) }
							tagName="figcaption"
							value={ caption }
						/>
					) }
				</>
			);
			return (
				<figure { ...useBlockProps.save( { className: classes } ) }>
					{ figure }
				</figure>
			);
		},
	},
	// The following deprecation moves existing border radius styles onto the
	// inner img element where new border block support styles must be applied.
	// It will also add a new `.has-custom-border` class for existing blocks
	// with border radii set. This class is required to improve caption position
	// and styling when an image within a gallery has a custom border or
	// rounded corners.
	//
	// See: https://github.com/WordPress/gutenberg/pull/31366/
	{
		attributes: blockAttributes,
		supports: blockSupports,
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
				sizeSlug,
				title,
			} = attributes;

			const newRel = isEmpty( rel ) ? undefined : rel;

			const classes = classnames( {
				[ `align${ align }` ]: align,
				[ `size-${ sizeSlug }` ]: sizeSlug,
				'is-resized': width || height,
			} );

			const image = (
				<img
					src={ url }
					alt={ alt }
					className={ id ? `wp-image-${ id }` : null }
					width={ width }
					height={ height }
					title={ title }
				/>
			);

			const figure = (
				<>
					{ href ? (
						<a
							className={ linkClass }
							href={ href }
							target={ linkTarget }
							rel={ newRel }
						>
							{ image }
						</a>
					) : (
						image
					) }
					{ ! RichText.isEmpty( caption ) && (
						<RichText.Content
							tagName="figcaption"
							value={ caption }
						/>
					) }
				</>
			);

			return (
				<figure { ...useBlockProps.save( { className: classes } ) }>
					{ figure }
				</figure>
			);
		},
	},
	{
		attributes: {
			...blockAttributes,
			title: {
				type: 'string',
				source: 'attribute',
				selector: 'img',
				attribute: 'title',
			},
			sizeSlug: {
				type: 'string',
			},
		},
		supports: blockSupports,
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
				sizeSlug,
				title,
			} = attributes;

			const newRel = isEmpty( rel ) ? undefined : rel;

			const classes = classnames( {
				[ `align${ align }` ]: align,
				[ `size-${ sizeSlug }` ]: sizeSlug,
				'is-resized': width || height,
			} );

			const image = (
				<img
					src={ url }
					alt={ alt }
					className={ id ? `wp-image-${ id }` : null }
					width={ width }
					height={ height }
					title={ title }
				/>
			);

			const figure = (
				<>
					{ href ? (
						<a
							className={ linkClass }
							href={ href }
							target={ linkTarget }
							rel={ newRel }
						>
							{ image }
						</a>
					) : (
						image
					) }
					{ ! RichText.isEmpty( caption ) && (
						<RichText.Content
							tagName="figcaption"
							value={ caption }
						/>
					) }
				</>
			);

			if ( 'left' === align || 'right' === align || 'center' === align ) {
				return (
					<div { ...useBlockProps.save() }>
						<figure className={ classes }>{ figure }</figure>
					</div>
				);
			}

			return (
				<figure { ...useBlockProps.save( { className: classes } ) }>
					{ figure }
				</figure>
			);
		},
	},
	{
		attributes: blockAttributes,
		save( { attributes } ) {
			const { url, alt, caption, align, href, width, height, id } =
				attributes;

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
					{ ! RichText.isEmpty( caption ) && (
						<RichText.Content
							tagName="figcaption"
							value={ caption }
						/>
					) }
				</figure>
			);
		},
	},
	{
		attributes: blockAttributes,
		save( { attributes } ) {
			const { url, alt, caption, align, href, width, height, id } =
				attributes;

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
				<figure className={ align ? `align${ align }` : null }>
					{ href ? <a href={ href }>{ image }</a> : image }
					{ ! RichText.isEmpty( caption ) && (
						<RichText.Content
							tagName="figcaption"
							value={ caption }
						/>
					) }
				</figure>
			);
		},
	},
	{
		attributes: blockAttributes,
		save( { attributes } ) {
			const { url, alt, caption, align, href, width, height } =
				attributes;
			const extraImageProps = width || height ? { width, height } : {};
			const image = (
				<img src={ url } alt={ alt } { ...extraImageProps } />
			);

			let figureStyle = {};

			if ( width ) {
				figureStyle = { width };
			} else if ( align === 'left' || align === 'right' ) {
				figureStyle = { maxWidth: '50%' };
			}

			return (
				<figure
					className={ align ? `align${ align }` : null }
					style={ figureStyle }
				>
					{ href ? <a href={ href }>{ image }</a> : image }
					{ ! RichText.isEmpty( caption ) && (
						<RichText.Content
							tagName="figcaption"
							value={ caption }
						/>
					) }
				</figure>
			);
		},
	},
];

export default deprecated;
