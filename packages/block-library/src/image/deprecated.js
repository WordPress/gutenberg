/**
 * External dependencies
 */
import classnames from 'classnames';

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
};

const blockSupports = {
	anchor: true,
	behaviors: {
		lightbox: true,
	},
	color: {
		text: false,
		background: false,
	},
	filter: {
		duotone: true,
	},
	__experimentalBorder: {
		color: true,
		radius: true,
		width: true,
		__experimentalSkipSerialization: true,
		__experimentalDefaultControls: {
			color: true,
			radius: true,
			width: true,
		},
	},
};

const blockSelectors = {
	border: '.wp-block-image img, .wp-block-image .wp-block-image__crop-area, .wp-block-image .components-placeholder',
	filter: {
		duotone: '.wp-block-image img, .wp-block-image .components-placeholder',
	},
};

const deprecated = [
	{
		attributes: blockAttributes,
		supports: blockSupports,
		selectors: blockSelectors,
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

			const newRel = ! rel ? undefined : rel;
			const borderProps = getBorderClassesAndStyles( attributes );

			const classes = classnames( {
				[ `align${ align }` ]: align,
				[ `size-${ sizeSlug }` ]: sizeSlug,
				'is-resized': width || height,
				'has-custom-border':
					!! borderProps.className ||
					( borderProps.style &&
						Object.keys( borderProps.style ).length > 0 ),
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
		migrate( attributes ) {
			return {
				...attributes,
				width: attributes.width && `${ attributes.width }px`,
				height: attributes.height && `${ attributes.width }px`,
			};
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

			const newRel = ! rel ? undefined : rel;

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

			const newRel = ! rel ? undefined : rel;

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
