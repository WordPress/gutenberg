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
	__experimentalGetDimensionsClassesAndStyles as getDimensionsClassesAndStyles,
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

	const dimensionsProps = getDimensionsClassesAndStyles( attributes );

	// A set aspect ratio and "Crop image to fill" are mutually exclusive; the
	// aspect ratio takes precedence and the fill styles are ignored.
	const hasAspectRatio = !! dimensionsProps.className;

	const imageClasses = clsx(
		{
			[ `wp-image-${ mediaId }` ]: mediaId && mediaType === 'image',
			[ `size-${ mediaSizeSlug }` ]: mediaId && mediaType === 'image',
		},
		dimensionsProps.className
	);

	let mediaStyles = {};
	if ( hasAspectRatio ) {
		mediaStyles = dimensionsProps.style;
	} else if ( imageFill ) {
		mediaStyles = imageFillStyles( mediaUrl, focalPoint );
	}

	let image = mediaUrl ? (
		<img
			src={ mediaUrl }
			alt={ mediaAlt }
			className={ imageClasses || null }
			style={ mediaStyles }
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
		'is-image-fill-element': imageFill && ! hasAspectRatio,
	} );

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
