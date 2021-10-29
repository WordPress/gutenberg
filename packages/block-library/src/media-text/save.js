/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { imageFillStyles } from './media-container';
import { DEFAULT_MEDIA_SIZE_SLUG } from './constants';

const DEFAULT_MEDIA_WIDTH = 50;

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
}
