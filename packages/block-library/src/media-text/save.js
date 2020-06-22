/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { imageFillStyles } from './media-container';

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
}
