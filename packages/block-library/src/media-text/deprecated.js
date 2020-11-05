/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop, isEmpty, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { InnerBlocks, getColorClassName } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { imageFillStyles } from './media-container';

const DEFAULT_MEDIA_WIDTH = 50;

const migrateCustomColors = ( attributes ) => {
	if ( ! attributes.customBackgroundColor ) {
		return attributes;
	}
	const style = {
		color: {
			background: attributes.customBackgroundColor,
		},
	};
	return {
		...omit( attributes, [ 'customBackgroundColor' ] ),
		style,
	};
};

const baseAttributes = {
	align: {
		type: 'string',
		default: 'wide',
	},
	backgroundColor: {
		type: 'string',
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

export default [
	{
		attributes: {
			...baseAttributes,
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
				[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
				'is-image-fill': imageFill,
			} );
			const backgroundStyles = imageFill
				? imageFillStyles( mediaUrl, focalPoint )
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
	},
	{
		attributes: {
			...baseAttributes,
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
				[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
				'is-image-fill': imageFill,
			} );
			const backgroundStyles = imageFill
				? imageFillStyles( mediaUrl, focalPoint )
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
	},
	{
		attributes: {
			...baseAttributes,
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
	},
];
