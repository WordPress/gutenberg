/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	InnerBlocks,
	getColorClassName,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import deprecated from './deprecated';
import { imageFillStyles } from './media-container';
import metadata from './block.json';

export const DEFAULT_MEDIA_WIDTH = 50;

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Media & Text' ),

	description: __( 'Set media and words side-by-side for a richer layout.' ),

	icon,

	keywords: [ __( 'image' ), __( 'video' ) ],

	supports: {
		align: [ 'wide', 'full' ],
		html: false,
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/image' ],
				transform: ( { alt, url, id } ) => (
					createBlock( 'core/media-text', {
						mediaAlt: alt,
						mediaId: id,
						mediaUrl: url,
						mediaType: 'image',
					} )
				),
			},
			{
				type: 'block',
				blocks: [ 'core/video' ],
				transform: ( { src, id } ) => (
					createBlock( 'core/media-text', {
						mediaId: id,
						mediaUrl: src,
						mediaType: 'video',
					} )
				),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/image' ],
				isMatch: ( { mediaType, mediaUrl } ) => {
					return ! mediaUrl || mediaType === 'image';
				},
				transform: ( { mediaAlt, mediaId, mediaUrl } ) => {
					return createBlock( 'core/image', {
						alt: mediaAlt,
						id: mediaId,
						url: mediaUrl,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/video' ],
				isMatch: ( { mediaType, mediaUrl } ) => {
					return ! mediaUrl || mediaType === 'video';
				},
				transform: ( { mediaId, mediaUrl } ) => {
					return createBlock( 'core/video', {
						id: mediaId,
						src: mediaUrl,
					} );
				},
			},
		],
	},

	edit,

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
			image: () => <img src={ mediaUrl } alt={ mediaAlt } className={ ( mediaId && mediaType === 'image' ) ? `wp-image-${ mediaId }` : null } />,
			video: () => <video controls src={ mediaUrl } />,
		};
		const backgroundClass = getColorClassName( 'background-color', backgroundColor );
		const className = classnames( {
			'has-media-on-the-right': 'right' === mediaPosition,
			[ backgroundClass ]: backgroundClass,
			'is-stacked-on-mobile': isStackedOnMobile,
			[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
			'is-image-fill': imageFill,
		} );
		const backgroundStyles = imageFill ? imageFillStyles( mediaUrl, focalPoint ) : {};

		let gridTemplateColumns;
		if ( mediaWidth !== DEFAULT_MEDIA_WIDTH ) {
			gridTemplateColumns = 'right' === mediaPosition ? `auto ${ mediaWidth }%` : `${ mediaWidth }% auto`;
		}
		const style = {
			backgroundColor: backgroundClass ? undefined : customBackgroundColor,
			gridTemplateColumns,
		};
		return (
			<div className={ className } style={ style }>
				<figure className="wp-block-media-text__media" style={ backgroundStyles }>
					{ ( mediaTypeRenders[ mediaType ] || noop )() }
				</figure>
				<div className="wp-block-media-text__content">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},

	deprecated,
};
