/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	getColorClassName,
	useInnerBlocksProps,
	useBlockProps,
} from '@wordpress/block-editor';

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

const baseAttributes = {
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
		default: true,
	},
};

const v4ToV5BlockAttributes = {
	...baseAttributes,
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

const v4ToV5Supports = {
	anchor: true,
	align: [ 'wide', 'full' ],
	html: false,
	color: {
		gradients: true,
		link: true,
	},
};

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
		const newRel = isEmpty( rel ) ? undefined : rel;

		const imageClasses = classnames( {
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
		const className = classnames( {
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
};

// Version with CSS grid
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
		const newRel = isEmpty( rel ) ? undefined : rel;

		const imageClasses = classnames( {
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

		const className = classnames( {
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
};

const v3 = {
	attributes: {
		...baseAttributes,
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
	migrate: migrateCustomColors,
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
		const newRel = isEmpty( rel ) ? undefined : rel;

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
		const className = classnames( {
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

const v2 = {
	attributes: {
		...baseAttributes,
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
	migrate: migrateCustomColors,
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
		const className = classnames( {
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

const v1 = {
	attributes: {
		...baseAttributes,
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
		const className = classnames( {
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

export default [ v5, v4, v3, v2, v1 ];
