/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
} from '@wordpress/block-editor';

/**
 * Deprecation for adding the `wp-image-${id}` class to the image block for
 * responsive images.
 *
 * @see https://github.com/WordPress/gutenberg/pull/4898
 */
const v1 = {
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
	},
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
			<figure
				className={ align ? `align${ align }` : null }
				style={ figureStyle }
			>
				{ href ? <a href={ href }>{ image }</a> : image }
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	},
};

/**
 * Deprecation for adding the `is-resized` class to the image block to fix
 * captions on resized images.
 *
 * @see https://github.com/WordPress/gutenberg/pull/6496
 */
const v2 = {
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
	},
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
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	},
};

/**
 * Deprecation for image floats including a wrapping div.
 *
 * @see https://github.com/WordPress/gutenberg/pull/7721
 */
const v3 = {
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
			selector: 'figure > a',
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
		linkDestination: {
			type: 'string',
			default: 'none',
		},
	},
	save( { attributes } ) {
		const { url, alt, caption, align, href, width, height, id } =
			attributes;

		const classes = clsx( {
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
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	},
};

/**
 * Deprecation for removing the outer div wrapper around aligned images.
 *
 * @see https://github.com/WordPress/gutenberg/pull/38657
 */
const v4 = {
	attributes: {
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
	},
	supports: {
		anchor: true,
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

		const newRel = ! rel ? undefined : rel;

		const classes = clsx( {
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
					<RichText.Content tagName="figcaption" value={ caption } />
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
};

/**
 * Deprecation for moving existing border radius styles onto the inner img
 * element where new border block support styles must be applied.
 * It will also add a new `.has-custom-border` class for existing blocks
 * with border radii set. This class is required to improve caption position
 * and styling when an image within a gallery has a custom border or
 * rounded corners.
 *
 * @see https://github.com/WordPress/gutenberg/pull/31366
 */
const v5 = {
	attributes: {
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
	},
	supports: {
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
		__experimentalStyle: {
			spacing: {
				margin: '0 0 1em 0',
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

		const newRel = ! rel ? undefined : rel;

		const classes = clsx( {
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
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</>
		);

		return (
			<figure { ...useBlockProps.save( { className: classes } ) }>
				{ figure }
			</figure>
		);
	},
};

/**
 * Deprecation for adding width and height as style rules on the inner img.
 *
 * @see https://github.com/WordPress/gutenberg/pull/31366
 */
const v6 = {
	attributes: {
		align: {
			type: 'string',
		},
		url: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'src',
			role: 'content',
		},
		alt: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'alt',
			default: '',
			role: 'content',
		},
		caption: {
			type: 'string',
			source: 'html',
			selector: 'figcaption',
			role: 'content',
		},
		title: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'title',
			role: 'content',
		},
		href: {
			type: 'string',
			source: 'attribute',
			selector: 'figure > a',
			attribute: 'href',
			role: 'content',
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
			role: 'content',
		},
		width: {
			type: 'number',
		},
		height: {
			type: 'number',
		},
		aspectRatio: {
			type: 'string',
		},
		scale: {
			type: 'string',
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
	},
	migrate( attributes ) {
		const { height, width } = attributes;
		return {
			...attributes,
			width: typeof width === 'number' ? `${ width }px` : width,
			height: typeof height === 'number' ? `${ height }px` : height,
		};
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
			aspectRatio,
			scale,
			id,
			linkTarget,
			sizeSlug,
			title,
		} = attributes;

		const newRel = ! rel ? undefined : rel;
		const borderProps = getBorderClassesAndStyles( attributes );

		const classes = clsx( {
			[ `align${ align }` ]: align,
			[ `size-${ sizeSlug }` ]: sizeSlug,
			'is-resized': width || height,
			'has-custom-border':
				!! borderProps.className ||
				( borderProps.style &&
					Object.keys( borderProps.style ).length > 0 ),
		} );

		const imageClasses = clsx( borderProps.className, {
			[ `wp-image-${ id }` ]: !! id,
		} );

		const image = (
			<img
				src={ url }
				alt={ alt }
				className={ imageClasses || undefined }
				style={ {
					...borderProps.style,
					aspectRatio,
					objectFit: scale,
				} }
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
};

/**
 * Deprecation for converting to string width and height block attributes and
 * removing the width and height img element attributes which are not needed
 * as they get added by the TODO hook.
 *
 * @see https://github.com/WordPress/gutenberg/pull/53274
 */
const v7 = {
	attributes: {
		align: {
			type: 'string',
		},
		url: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'src',
			role: 'content',
		},
		alt: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'alt',
			default: '',
			role: 'content',
		},
		caption: {
			type: 'string',
			source: 'html',
			selector: 'figcaption',
			role: 'content',
		},
		title: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'title',
			role: 'content',
		},
		href: {
			type: 'string',
			source: 'attribute',
			selector: 'figure > a',
			attribute: 'href',
			role: 'content',
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
			role: 'content',
		},
		width: {
			type: 'number',
		},
		height: {
			type: 'number',
		},
		aspectRatio: {
			type: 'string',
		},
		scale: {
			type: 'string',
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
	},
	migrate( { width, height, ...attributes } ) {
		return {
			...attributes,
			width: `${ width }px`,
			height: `${ height }px`,
		};
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
			aspectRatio,
			scale,
			id,
			linkTarget,
			sizeSlug,
			title,
		} = attributes;

		const newRel = ! rel ? undefined : rel;
		const borderProps = getBorderClassesAndStyles( attributes );

		const classes = clsx( {
			[ `align${ align }` ]: align,
			[ `size-${ sizeSlug }` ]: sizeSlug,
			'is-resized': width || height,
			'has-custom-border':
				!! borderProps.className ||
				( borderProps.style &&
					Object.keys( borderProps.style ).length > 0 ),
		} );

		const imageClasses = clsx( borderProps.className, {
			[ `wp-image-${ id }` ]: !! id,
		} );

		const image = (
			<img
				src={ url }
				alt={ alt }
				className={ imageClasses || undefined }
				style={ {
					...borderProps.style,
					aspectRatio,
					objectFit: scale,
					width,
					height,
				} }
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
};

const v8 = {
	attributes: {
		align: {
			type: 'string',
		},
		behaviors: {
			type: 'object',
		},
		url: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'src',
			role: 'content',
		},
		alt: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'alt',
			default: '',
			role: 'content',
		},
		caption: {
			type: 'string',
			source: 'html',
			selector: 'figcaption',
			role: 'content',
		},
		title: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'title',
			role: 'content',
		},
		href: {
			type: 'string',
			source: 'attribute',
			selector: 'figure > a',
			attribute: 'href',
			role: 'content',
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
			role: 'content',
		},
		width: {
			type: 'string',
		},
		height: {
			type: 'string',
		},
		aspectRatio: {
			type: 'string',
		},
		scale: {
			type: 'string',
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
	},
	migrate( { width, height, ...attributes } ) {
		// We need to perform a check here because in cases
		// where attributes are added dynamically to blocks,
		// block invalidation overrides the isEligible() method
		// and forces the migration to run, so it's not guaranteed
		// that `behaviors` or `behaviors.lightbox` will be defined.
		if ( ! attributes.behaviors?.lightbox ) {
			return attributes;
		}
		const {
			behaviors: {
				lightbox: { enabled },
			},
		} = attributes;
		const newAttributes = {
			...attributes,
			lightbox: {
				enabled,
			},
		};
		delete newAttributes.behaviors;
		return newAttributes;
	},
	isEligible( attributes ) {
		return !! attributes.behaviors;
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
			aspectRatio,
			scale,
			id,
			linkTarget,
			sizeSlug,
			title,
		} = attributes;

		const newRel = ! rel ? undefined : rel;
		const borderProps = getBorderClassesAndStyles( attributes );

		const classes = clsx( {
			[ `align${ align }` ]: align,
			[ `size-${ sizeSlug }` ]: sizeSlug,
			'is-resized': width || height,
			'has-custom-border':
				!! borderProps.className ||
				( borderProps.style &&
					Object.keys( borderProps.style ).length > 0 ),
		} );

		const imageClasses = clsx( borderProps.className, {
			[ `wp-image-${ id }` ]: !! id,
		} );

		const image = (
			<img
				src={ url }
				alt={ alt }
				className={ imageClasses || undefined }
				style={ {
					...borderProps.style,
					aspectRatio,
					objectFit: scale,
					width,
					height,
				} }
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
};

export default [ v8, v7, v6, v5, v4, v3, v2, v1 ];
