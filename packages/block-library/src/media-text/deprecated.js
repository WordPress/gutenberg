/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	getColorClassName,
	useInnerBlocksProps,
	useBlockProps,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { DEFAULT_MEDIA_SIZE_SLUG } from './constants';

const v1ToV5ImageFillStyles = ( url, focalPoint ) => {
	return url
		? {
				backgroundImage: `url(${ url })`,
				backgroundPosition: focalPoint
					? `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`
					: `50% 50%`,
		  }
		: {};
};

const v6ToV7ImageFillStyles = ( url, focalPoint ) => {
	return url
		? {
				backgroundImage: `url(${ url })`,
				backgroundPosition: focalPoint
					? `${ Math.round( focalPoint.x * 100 ) }% ${ Math.round(
							focalPoint.y * 100
					  ) }%`
					: `50% 50%`,
		  }
		: {};
};

const DEFAULT_MEDIA_WIDTH = 50;
const noop = () => {};

const migrateCustomColors = ( attributes ) => {
	if ( ! attributes.customBackgroundColor ) {
		return attributes;
	}
	const style = {
		color: {
			background: attributes.customBackgroundColor,
		},
	};
	const { customBackgroundColor, ...restAttributes } = attributes;
	return {
		...restAttributes,
		style,
	};
};

// After align attribute's default was updated this function explicitly sets
// the align value for deprecated blocks to the `wide` value which was default
// for their versions of this block.
const migrateDefaultAlign = ( attributes ) => {
	if ( attributes.align ) {
		return attributes;
	}

	return {
		...attributes,
		align: 'wide',
	};
};

const v0Attributes = {
	align: {
		type: 'string',
		default: 'wide',
	},
	mediaAlt: {
		type: 'string',
		source: 'attribute',
		selector: 'figure img',
		attribute: 'alt',
		default: '',
	},
	mediaPosition: {
		type: 'string',
		default: 'left',
	},
	mediaId: {
		type: 'number',
	},
	mediaType: {
		type: 'string',
	},
	mediaWidth: {
		type: 'number',
		default: 50,
	},
	isStackedOnMobile: {
		type: 'boolean',
		default: false,
	},
};

const v4ToV5BlockAttributes = {
	...v0Attributes,
	isStackedOnMobile: {
		type: 'boolean',
		default: true,
	},
	mediaUrl: {
		type: 'string',
		source: 'attribute',
		selector: 'figure video,figure img',
		attribute: 'src',
	},
	mediaLink: {
		type: 'string',
	},
	linkDestination: {
		type: 'string',
	},
	linkTarget: {
		type: 'string',
		source: 'attribute',
		selector: 'figure a',
		attribute: 'target',
	},
	href: {
		type: 'string',
		source: 'attribute',
		selector: 'figure a',
		attribute: 'href',
	},
	rel: {
		type: 'string',
		source: 'attribute',
		selector: 'figure a',
		attribute: 'rel',
	},
	linkClass: {
		type: 'string',
		source: 'attribute',
		selector: 'figure a',
		attribute: 'class',
	},
	mediaSizeSlug: {
		type: 'string',
	},
	verticalAlignment: {
		type: 'string',
	},
	imageFill: {
		type: 'boolean',
	},
	focalPoint: {
		type: 'object',
	},
};

const v6Attributes = {
	...v4ToV5BlockAttributes,
	mediaAlt: {
		type: 'string',
		source: 'attribute',
		selector: 'figure img',
		attribute: 'alt',
		default: '',
		role: 'content',
	},
	mediaId: {
		type: 'number',
		role: 'content',
	},
	mediaUrl: {
		type: 'string',
		source: 'attribute',
		selector: 'figure video,figure img',
		attribute: 'src',
		role: 'content',
	},
	href: {
		type: 'string',
		source: 'attribute',
		selector: 'figure a',
		attribute: 'href',
		role: 'content',
	},
	mediaType: {
		type: 'string',
		role: 'content',
	},
};

const v7Attributes = {
	...v6Attributes,
	align: {
		type: 'string',
		// v7 changed the default for the `align` attribute.
		default: 'none',
	},
	// New attribute.
	useFeaturedImage: {
		type: 'boolean',
		default: false,
	},
};

const v4ToV5Supports = {
	anchor: true,
	align: [ 'wide', 'full' ],
	html: false,
	color: {
		gradients: true,
		link: true,
	},
};

const v6Supports = {
	...v4ToV5Supports,
	color: {
		gradients: true,
		link: true,
		__experimentalDefaultControls: {
			background: true,
			text: true,
		},
	},
	spacing: {
		margin: true,
		padding: true,
	},
	typography: {
		fontSize: true,
		lineHeight: true,
		__experimentalFontFamily: true,
		__experimentalFontWeight: true,
		__experimentalFontStyle: true,
		__experimentalTextTransform: true,
		__experimentalTextDecoration: true,
		__experimentalLetterSpacing: true,
		__experimentalDefaultControls: {
			fontSize: true,
		},
	},
};

const v7Supports = {
	...v6Supports,
	__experimentalBorder: {
		color: true,
		radius: true,
		style: true,
		width: true,
		__experimentalDefaultControls: {
			color: true,
			radius: true,
			style: true,
			width: true,
		},
	},
	color: {
		gradients: true,
		heading: true,
		link: true,
		__experimentalDefaultControls: {
			background: true,
			text: true,
		},
	},
	interactivity: {
		clientNavigation: true,
	},
};

// Version with 'none' as the default alignment.
// See: https://github.com/WordPress/gutenberg/pull/64981
const v7 = {
	attributes: v7Attributes,
	supports: v7Supports,
	usesContext: [ 'postId', 'postType' ],
	save( { attributes } ) {
		const {
			isStackedOnMobile,
			mediaAlt,
			mediaPosition,
			mediaType,
			mediaUrl,
			mediaWidth,
			mediaId,
			verticalAlignment,
			imageFill,
			focalPoint,
			linkClass,
			href,
			linkTarget,
			rel,
		} = attributes;
		const mediaSizeSlug =
			attributes.mediaSizeSlug || DEFAULT_MEDIA_SIZE_SLUG;
		const newRel = ! rel ? undefined : rel;

		const imageClasses = clsx( {
			[ `wp-image-${ mediaId }` ]: mediaId && mediaType === 'image',
			[ `size-${ mediaSizeSlug }` ]: mediaId && mediaType === 'image',
		} );

		let image = mediaUrl ? (
			<img
				src={ mediaUrl }
				alt={ mediaAlt }
				className={ imageClasses || null }
			/>
		) : null;

		if ( href ) {
			image = (
				<a
					className={ linkClass }
					href={ href }
					target={ linkTarget }
					rel={ newRel }
				>
					{ image }
				</a>
			);
		}

		const mediaTypeRenders = {
			image: () => image,
			video: () => <video controls src={ mediaUrl } />,
		};
		const className = clsx( {
			'has-media-on-the-right': 'right' === mediaPosition,
			'is-stacked-on-mobile': isStackedOnMobile,
			[ `is-vertically-aligned-${ verticalAlignment }` ]:
				verticalAlignment,
			'is-image-fill': imageFill,
		} );
		const backgroundStyles = imageFill
			? v6ToV7ImageFillStyles( mediaUrl, focalPoint )
			: {};

		let gridTemplateColumns;
		if ( mediaWidth !== DEFAULT_MEDIA_WIDTH ) {
			gridTemplateColumns =
				'right' === mediaPosition
					? `auto ${ mediaWidth }%`
					: `${ mediaWidth }% auto`;
		}
		const style = {
			gridTemplateColumns,
		};

		if ( 'right' === mediaPosition ) {
			return (
				<div { ...useBlockProps.save( { className, style } ) }>
					<div
						{ ...useInnerBlocksProps.save( {
							className: 'wp-block-media-text__content',
						} ) }
					/>
					<figure
						className="wp-block-media-text__media"
						style={ backgroundStyles }
					>
						{ ( mediaTypeRenders[ mediaType ] || noop )() }
					</figure>
				</div>
			);
		}
		return (
			<div { ...useBlockProps.save( { className, style } ) }>
				<figure
					className="wp-block-media-text__media"
					style={ backgroundStyles }
				>
					{ ( mediaTypeRenders[ mediaType ] || noop )() }
				</figure>
				<div
					{ ...useInnerBlocksProps.save( {
						className: 'wp-block-media-text__content',
					} ) }
				/>
			</div>
		);
	},
};

// Version with wide as the default alignment.
// See: https://github.com/WordPress/gutenberg/pull/48404
const v6 = {
	attributes: v6Attributes,
	supports: v6Supports,
	save( { attributes } ) {
		const {
			isStackedOnMobile,
			mediaAlt,
			mediaPosition,
			mediaType,
			mediaUrl,
			mediaWidth,
			mediaId,
			verticalAlignment,
			imageFill,
			focalPoint,
			linkClass,
			href,
			linkTarget,
			rel,
		} = attributes;
		const mediaSizeSlug =
			attributes.mediaSizeSlug || DEFAULT_MEDIA_SIZE_SLUG;
		const newRel = ! rel ? undefined : rel;

		const imageClasses = clsx( {
			[ `wp-image-${ mediaId }` ]: mediaId && mediaType === 'image',
			[ `size-${ mediaSizeSlug }` ]: mediaId && mediaType === 'image',
		} );

		let image = (
			<img
				src={ mediaUrl }
				alt={ mediaAlt }
				className={ imageClasses || null }
			/>
		);

		if ( href ) {
			image = (
				<a
					className={ linkClass }
					href={ href }
					target={ linkTarget }
					rel={ newRel }
				>
					{ image }
				</a>
			);
		}

		const mediaTypeRenders = {
			image: () => image,
			video: () => <video controls src={ mediaUrl } />,
		};
		const className = clsx( {
			'has-media-on-the-right': 'right' === mediaPosition,
			'is-stacked-on-mobile': isStackedOnMobile,
			[ `is-vertically-aligned-${ verticalAlignment }` ]:
				verticalAlignment,
			'is-image-fill': imageFill,
		} );
		const backgroundStyles = imageFill
			? v6ToV7ImageFillStyles( mediaUrl, focalPoint )
			: {};

		let gridTemplateColumns;
		if ( mediaWidth !== DEFAULT_MEDIA_WIDTH ) {
			gridTemplateColumns =
				'right' === mediaPosition
					? `auto ${ mediaWidth }%`
					: `${ mediaWidth }% auto`;
		}
		const style = {
			gridTemplateColumns,
		};

		if ( 'right' === mediaPosition ) {
			return (
				<div { ...useBlockProps.save( { className, style } ) }>
					<div
						{ ...useInnerBlocksProps.save( {
							className: 'wp-block-media-text__content',
						} ) }
					/>
					<figure
						className="wp-block-media-text__media"
						style={ backgroundStyles }
					>
						{ ( mediaTypeRenders[ mediaType ] || noop )() }
					</figure>
				</div>
			);
		}
		return (
			<div { ...useBlockProps.save( { className, style } ) }>
				<figure
					className="wp-block-media-text__media"
					style={ backgroundStyles }
				>
					{ ( mediaTypeRenders[ mediaType ] || noop )() }
				</figure>
				<div
					{ ...useInnerBlocksProps.save( {
						className: 'wp-block-media-text__content',
					} ) }
				/>
			</div>
		);
	},
	migrate: migrateDefaultAlign,
	isEligible( attributes, innerBlocks, { block } ) {
		const { attributes: finalizedAttributes } = block;
		// When the align attribute defaults to none, valid block markup should
		// not contain any alignment CSS class. Unfortunately, this
		// deprecation's version of the block won't be invalidated due to the
		// alignwide class still being in the markup. That is because the custom
		// CSS classname support picks it up and adds it to the className
		// attribute. At the time of parsing, the className attribute won't
		// contain the alignwide class, hence the need to check the finalized
		// block attributes.
		return (
			attributes.align === undefined &&
			!! finalizedAttributes.className?.includes( 'alignwide' )
		);
	},
};

// Version with non-rounded background position attribute for focal point.
// See: https://github.com/WordPress/gutenberg/pull/33915
const v5 = {
	attributes: v4ToV5BlockAttributes,
	supports: v4ToV5Supports,
	save( { attributes } ) {
		const {
			isStackedOnMobile,
			mediaAlt,
			mediaPosition,
			mediaType,
			mediaUrl,
			mediaWidth,
			mediaId,
			verticalAlignment,
			imageFill,
			focalPoint,
			linkClass,
			href,
			linkTarget,
			rel,
		} = attributes;
		const mediaSizeSlug =
			attributes.mediaSizeSlug || DEFAULT_MEDIA_SIZE_SLUG;
		const newRel = ! rel ? undefined : rel;

		const imageClasses = clsx( {
			[ `wp-image-${ mediaId }` ]: mediaId && mediaType === 'image',
			[ `size-${ mediaSizeSlug }` ]: mediaId && mediaType === 'image',
		} );

		let image = (
			<img
				src={ mediaUrl }
				alt={ mediaAlt }
				className={ imageClasses || null }
			/>
		);

		if ( href ) {
			image = (
				<a
					className={ linkClass }
					href={ href }
					target={ linkTarget }
					rel={ newRel }
				>
					{ image }
				</a>
			);
		}

		const mediaTypeRenders = {
			image: () => image,
			video: () => <video controls src={ mediaUrl } />,
		};
		const className = clsx( {
			'has-media-on-the-right': 'right' === mediaPosition,
			'is-stacked-on-mobile': isStackedOnMobile,
			[ `is-vertically-aligned-${ verticalAlignment }` ]:
				verticalAlignment,
			'is-image-fill': imageFill,
		} );
		const backgroundStyles = imageFill
			? v1ToV5ImageFillStyles( mediaUrl, focalPoint )
			: {};

		let gridTemplateColumns;
		if ( mediaWidth !== DEFAULT_MEDIA_WIDTH ) {
			gridTemplateColumns =
				'right' === mediaPosition
					? `auto ${ mediaWidth }%`
					: `${ mediaWidth }% auto`;
		}
		const style = {
			gridTemplateColumns,
		};

		if ( 'right' === mediaPosition ) {
			return (
				<div { ...useBlockProps.save( { className, style } ) }>
					<div
						{ ...useInnerBlocksProps.save( {
							className: 'wp-block-media-text__content',
						} ) }
					/>
					<figure
						className="wp-block-media-text__media"
						style={ backgroundStyles }
					>
						{ ( mediaTypeRenders[ mediaType ] || noop )() }
					</figure>
				</div>
			);
		}
		return (
			<div { ...useBlockProps.save( { className, style } ) }>
				<figure
					className="wp-block-media-text__media"
					style={ backgroundStyles }
				>
					{ ( mediaTypeRenders[ mediaType ] || noop )() }
				</figure>
				<div
					{ ...useInnerBlocksProps.save( {
						className: 'wp-block-media-text__content',
					} ) }
				/>
			</div>
		);
	},
	migrate: migrateDefaultAlign,
};

// Version with CSS grid
// See: https://github.com/WordPress/gutenberg/pull/40806
const v4 = {
	attributes: v4ToV5BlockAttributes,
	supports: v4ToV5Supports,
	save( { attributes } ) {
		const {
			isStackedOnMobile,
			mediaAlt,
			mediaPosition,
			mediaType,
			mediaUrl,
			mediaWidth,
			mediaId,
			verticalAlignment,
			imageFill,
			focalPoint,
			linkClass,
			href,
			linkTarget,
			rel,
		} = attributes;
		const mediaSizeSlug =
			attributes.mediaSizeSlug || DEFAULT_MEDIA_SIZE_SLUG;
		const newRel = ! rel ? undefined : rel;

		const imageClasses = clsx( {
			[ `wp-image-${ mediaId }` ]: mediaId && mediaType === 'image',
			[ `size-${ mediaSizeSlug }` ]: mediaId && mediaType === 'image',
		} );

		let image = (
			<img
				src={ mediaUrl }
				alt={ mediaAlt }
				className={ imageClasses || null }
			/>
		);

		if ( href ) {
			image = (
				<a
					className={ linkClass }
					href={ href }
					target={ linkTarget }
					rel={ newRel }
				>
					{ image }
				</a>
			);
		}

		const mediaTypeRenders = {
			image: () => image,
			video: () => <video controls src={ mediaUrl } />,
		};

		const className = clsx( {
			'has-media-on-the-right': 'right' === mediaPosition,
			'is-stacked-on-mobile': isStackedOnMobile,
			[ `is-vertically-aligned-${ verticalAlignment }` ]:
				verticalAlignment,
			'is-image-fill': imageFill,
		} );
		const backgroundStyles = imageFill
			? v1ToV5ImageFillStyles( mediaUrl, focalPoint )
			: {};

		let gridTemplateColumns;
		if ( mediaWidth !== DEFAULT_MEDIA_WIDTH ) {
			gridTemplateColumns =
				'right' === mediaPosition
					? `auto ${ mediaWidth }%`
					: `${ mediaWidth }% auto`;
		}
		const style = {
			gridTemplateColumns,
		};

		return (
			<div { ...useBlockProps.save( { className, style } ) }>
				<figure
					className="wp-block-media-text__media"
					style={ backgroundStyles }
				>
					{ ( mediaTypeRenders[ mediaType ] || noop )() }
				</figure>
				<div
					{ ...useInnerBlocksProps.save( {
						className: 'wp-block-media-text__content',
					} ) }
				/>
			</div>
		);
	},
	migrate: migrateDefaultAlign,
};

// Version with ad-hoc color attributes
// See: https://github.com/WordPress/gutenberg/pull/21169
const v3 = {
	attributes: {
		...v0Attributes,
		isStackedOnMobile: {
			type: 'boolean',
			default: true,
		},
		backgroundColor: {
			type: 'string',
		},
		customBackgroundColor: {
			type: 'string',
		},
		mediaLink: {
			type: 'string',
		},
		linkDestination: {
			type: 'string',
		},
		linkTarget: {
			type: 'string',
			source: 'attribute',
			selector: 'figure a',
			attribute: 'target',
		},
		href: {
			type: 'string',
			source: 'attribute',
			selector: 'figure a',
			attribute: 'href',
		},
		rel: {
			type: 'string',
			source: 'attribute',
			selector: 'figure a',
			attribute: 'rel',
		},
		linkClass: {
			type: 'string',
			source: 'attribute',
			selector: 'figure a',
			attribute: 'class',
		},
		verticalAlignment: {
			type: 'string',
		},
		imageFill: {
			type: 'boolean',
		},
		focalPoint: {
			type: 'object',
		},
	},
	migrate: compose( migrateCustomColors, migrateDefaultAlign ),
	save( { attributes } ) {
		const {
			backgroundColor,
			customBackgroundColor,
			isStackedOnMobile,
			mediaAlt,
			mediaPosition,
			mediaType,
			mediaUrl,
			mediaWidth,
			mediaId,
			verticalAlignment,
			imageFill,
			focalPoint,
			linkClass,
			href,
			linkTarget,
			rel,
		} = attributes;
		const newRel = ! rel ? undefined : rel;

		let image = (
			<img
				src={ mediaUrl }
				alt={ mediaAlt }
				className={
					mediaId && mediaType === 'image'
						? `wp-image-${ mediaId }`
						: null
				}
			/>
		);

		if ( href ) {
			image = (
				<a
					className={ linkClass }
					href={ href }
					target={ linkTarget }
					rel={ newRel }
				>
					{ image }
				</a>
			);
		}

		const mediaTypeRenders = {
			image: () => image,
			video: () => <video controls src={ mediaUrl } />,
		};
		const backgroundClass = getColorClassName(
			'background-color',
			backgroundColor
		);
		const className = clsx( {
			'has-media-on-the-right': 'right' === mediaPosition,
			'has-background': backgroundClass || customBackgroundColor,
			[ backgroundClass ]: backgroundClass,
			'is-stacked-on-mobile': isStackedOnMobile,
			[ `is-vertically-aligned-${ verticalAlignment }` ]:
				verticalAlignment,
			'is-image-fill': imageFill,
		} );
		const backgroundStyles = imageFill
			? v1ToV5ImageFillStyles( mediaUrl, focalPoint )
			: {};

		let gridTemplateColumns;
		if ( mediaWidth !== DEFAULT_MEDIA_WIDTH ) {
			gridTemplateColumns =
				'right' === mediaPosition
					? `auto ${ mediaWidth }%`
					: `${ mediaWidth }% auto`;
		}
		const style = {
			backgroundColor: backgroundClass
				? undefined
				: customBackgroundColor,
			gridTemplateColumns,
		};
		return (
			<div className={ className } style={ style }>
				<figure
					className="wp-block-media-text__media"
					style={ backgroundStyles }
				>
					{ ( mediaTypeRenders[ mediaType ] || noop )() }
				</figure>
				<div className="wp-block-media-text__content">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},
};

// Version with stack on mobile off by default
// See: https://github.com/WordPress/gutenberg/pull/14364
const v2 = {
	attributes: {
		...v0Attributes,
		backgroundColor: {
			type: 'string',
		},
		customBackgroundColor: {
			type: 'string',
		},
		mediaUrl: {
			type: 'string',
			source: 'attribute',
			selector: 'figure video,figure img',
			attribute: 'src',
		},
		verticalAlignment: {
			type: 'string',
		},
		imageFill: {
			type: 'boolean',
		},
		focalPoint: {
			type: 'object',
		},
	},
	migrate: compose( migrateCustomColors, migrateDefaultAlign ),
	save( { attributes } ) {
		const {
			backgroundColor,
			customBackgroundColor,
			isStackedOnMobile,
			mediaAlt,
			mediaPosition,
			mediaType,
			mediaUrl,
			mediaWidth,
			mediaId,
			verticalAlignment,
			imageFill,
			focalPoint,
		} = attributes;
		const mediaTypeRenders = {
			image: () => (
				<img
					src={ mediaUrl }
					alt={ mediaAlt }
					className={
						mediaId && mediaType === 'image'
							? `wp-image-${ mediaId }`
							: null
					}
				/>
			),
			video: () => <video controls src={ mediaUrl } />,
		};
		const backgroundClass = getColorClassName(
			'background-color',
			backgroundColor
		);
		const className = clsx( {
			'has-media-on-the-right': 'right' === mediaPosition,
			[ backgroundClass ]: backgroundClass,
			'is-stacked-on-mobile': isStackedOnMobile,
			[ `is-vertically-aligned-${ verticalAlignment }` ]:
				verticalAlignment,
			'is-image-fill': imageFill,
		} );
		const backgroundStyles = imageFill
			? v1ToV5ImageFillStyles( mediaUrl, focalPoint )
			: {};

		let gridTemplateColumns;
		if ( mediaWidth !== DEFAULT_MEDIA_WIDTH ) {
			gridTemplateColumns =
				'right' === mediaPosition
					? `auto ${ mediaWidth }%`
					: `${ mediaWidth }% auto`;
		}
		const style = {
			backgroundColor: backgroundClass
				? undefined
				: customBackgroundColor,
			gridTemplateColumns,
		};
		return (
			<div className={ className } style={ style }>
				<figure
					className="wp-block-media-text__media"
					style={ backgroundStyles }
				>
					{ ( mediaTypeRenders[ mediaType ] || noop )() }
				</figure>
				<div className="wp-block-media-text__content">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},
};

// Version without the wp-image-#### class on image
// See: https://github.com/WordPress/gutenberg/pull/11922
const v1 = {
	attributes: {
		...v0Attributes,
		backgroundColor: {
			type: 'string',
		},
		customBackgroundColor: {
			type: 'string',
		},
		mediaUrl: {
			type: 'string',
			source: 'attribute',
			selector: 'figure video,figure img',
			attribute: 'src',
		},
	},
	migrate: migrateDefaultAlign,
	save( { attributes } ) {
		const {
			backgroundColor,
			customBackgroundColor,
			isStackedOnMobile,
			mediaAlt,
			mediaPosition,
			mediaType,
			mediaUrl,
			mediaWidth,
		} = attributes;
		const mediaTypeRenders = {
			image: () => <img src={ mediaUrl } alt={ mediaAlt } />,
			video: () => <video controls src={ mediaUrl } />,
		};
		const backgroundClass = getColorClassName(
			'background-color',
			backgroundColor
		);
		const className = clsx( {
			'has-media-on-the-right': 'right' === mediaPosition,
			[ backgroundClass ]: backgroundClass,
			'is-stacked-on-mobile': isStackedOnMobile,
		} );

		let gridTemplateColumns;
		if ( mediaWidth !== DEFAULT_MEDIA_WIDTH ) {
			gridTemplateColumns =
				'right' === mediaPosition
					? `auto ${ mediaWidth }%`
					: `${ mediaWidth }% auto`;
		}
		const style = {
			backgroundColor: backgroundClass
				? undefined
				: customBackgroundColor,
			gridTemplateColumns,
		};
		return (
			<div className={ className } style={ style }>
				<figure className="wp-block-media-text__media">
					{ ( mediaTypeRenders[ mediaType ] || noop )() }
				</figure>
				<div className="wp-block-media-text__content">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},
};

export default [ v7, v6, v5, v4, v3, v2, v1 ];
