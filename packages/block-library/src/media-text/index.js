/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	InnerBlocks,
	getColorClassName,
} from '@wordpress/editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';

const DEFAULT_MEDIA_WIDTH = 50;

export const name = 'core/media-text';

const blockAttributes = {
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

export const settings = {
	title: __( 'Media & Text' ),

	description: __( 'Set media and words side-by-side for a richer layout.' ),

	icon: <SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><Path d="M13 17h8v-2h-8v2zM3 19h8V5H3v14zM13 9h8V7h-8v2zm0 4h8v-2h-8v2z" /></SVG>,

	category: 'layout',

	keywords: [ __( 'image' ), __( 'video' ) ],

	attributes: blockAttributes,

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
		} );

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
				<figure className="wp-block-media-text__media" >
					{ ( mediaTypeRenders[ mediaType ] || noop )() }
				</figure>
				<div className="wp-block-media-text__content">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},

	deprecated: [
		{
			attributes: blockAttributes,
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
				const backgroundClass = getColorClassName( 'background-color', backgroundColor );
				const className = classnames( {
					'has-media-on-the-right': 'right' === mediaPosition,
					[ backgroundClass ]: backgroundClass,
					'is-stacked-on-mobile': isStackedOnMobile,
				} );

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
						<figure className="wp-block-media-text__media" >
							{ ( mediaTypeRenders[ mediaType ] || noop )() }
						</figure>
						<div className="wp-block-media-text__content">
							<InnerBlocks.Content />
						</div>
					</div>
				);
			},
		},
	],
};
