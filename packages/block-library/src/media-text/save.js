/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useInnerBlocksProps,
	useBlockProps,
	__experimentalGetGapCSSValue as getGapCSSValue,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { imageFillStyles } from './image-fill';
import { DEFAULT_MEDIA_SIZE_SLUG } from './constants';

const DEFAULT_MEDIA_WIDTH = 50;
const noop = () => {};

export default function save( { attributes } ) {
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
	const mediaSizeSlug = attributes.mediaSizeSlug || DEFAULT_MEDIA_SIZE_SLUG;
	const newRel = ! rel ? undefined : rel;

	const imageClasses = clsx( {
		[ `wp-image-${ mediaId }` ]: mediaId && mediaType === 'image',
		[ `size-${ mediaSizeSlug }` ]: mediaId && mediaType === 'image',
	} );

	const positionStyles = imageFill
		? imageFillStyles( mediaUrl, focalPoint )
		: {};

	let image = mediaUrl ? (
		<img
			src={ mediaUrl }
			alt={ mediaAlt }
			className={ imageClasses || null }
			style={ positionStyles }
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
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		'is-image-fill-element': imageFill,
	} );

	let gridTemplateColumns;
	if ( mediaWidth !== DEFAULT_MEDIA_WIDTH ) {
		gridTemplateColumns =
			'right' === mediaPosition
				? `auto ${ mediaWidth }%`
				: `${ mediaWidth }% auto`;
	}

	const blockGap = attributes?.style?.spacing.blockGap;

	const fallbackValue = 'var(--wp--style--block-gap)';

	let gapStyle = { gap: fallbackValue };

	if ( !! blockGap ) {
		const row =
			typeof blockGap === 'string'
				? getGapCSSValue( blockGap )
				: getGapCSSValue( blockGap?.top ) || fallbackValue;
		const col =
			typeof blockGap === 'string'
				? getGapCSSValue( blockGap )
				: getGapCSSValue( blockGap?.left ) || fallbackValue;

		if ( col === row ) {
			gapStyle = {
				gap: col,
			};
		} else {
			gapStyle = {
				columnGap: col,
				rowGap: row,
			};
		}
	}

	const style = {
		gridTemplateColumns,
		...gapStyle,
	};

	if ( 'right' === mediaPosition ) {
		return (
			<div { ...useBlockProps.save( { className, style } ) }>
				<div
					{ ...useInnerBlocksProps.save( {
						className: 'wp-block-media-text__content',
					} ) }
				/>
				<figure className="wp-block-media-text__media">
					{ ( mediaTypeRenders[ mediaType ] || noop )() }
				</figure>
			</div>
		);
	}
	return (
		<div { ...useBlockProps.save( { className, style } ) }>
			<figure className="wp-block-media-text__media">
				{ ( mediaTypeRenders[ mediaType ] || noop )() }
			</figure>
			<div
				{ ...useInnerBlocksProps.save( {
					className: 'wp-block-media-text__content',
				} ) }
			/>
		</div>
	);
}
