/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { InnerBlocks, getColorClassName } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { imageFillStyles } from './media-container';

const DEFAULT_MEDIA_WIDTH = 50;

const baseAttributes = {
	align: {
		type: 'string',
		default: 'wide',
	},
	backgroundColor: {
		type: 'string',
	},
	customBackgroundColor: {
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
	mediaUrl: {
		type: 'string',
		source: 'attribute',
		selector: 'figure video,figure img',
		attribute: 'src',
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

export default [
	{
		attributes: {
			...baseAttributes,
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
		attributes: baseAttributes,
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
