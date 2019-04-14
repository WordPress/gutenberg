/**
 * External dependencies
 */
import { omit } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	RichText,
	getColorClassName,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import {
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	backgroundImageStyles,
	dimRatioToClass,
} from './shared';

const { name, attributes: blockAttributes } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Cover' ),
	description: __( 'Add an image or video with a text overlay — great for headers.' ),
	icon,
	supports: {
		align: true,
	},
	transforms,
	save,
	edit,
	deprecated: [ {
		attributes: {
			...blockAttributes,
			title: {
				type: 'string',
				source: 'html',
				selector: 'p',
			},
			contentAlign: {
				type: 'string',
				default: 'center',
			},
		},

		supports: {
			align: true,
		},

		save( { attributes } ) {
			const {
				backgroundType,
				contentAlign,
				customOverlayColor,
				dimRatio,
				focalPoint,
				hasParallax,
				overlayColor,
				title,
				url,
			} = attributes;
			const overlayColorClass = getColorClassName( 'background-color', overlayColor );
			const style = backgroundType === IMAGE_BACKGROUND_TYPE ?
				backgroundImageStyles( url ) :
				{};
			if ( ! overlayColorClass ) {
				style.backgroundColor = customOverlayColor;
			}
			if ( focalPoint && ! hasParallax ) {
				style.backgroundPosition = `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`;
			}

			const classes = classnames(
				dimRatioToClass( dimRatio ),
				overlayColorClass,
				{
					'has-background-dim': dimRatio !== 0,
					'has-parallax': hasParallax,
					[ `has-${ contentAlign }-content` ]: contentAlign !== 'center',
				},
			);

			return (
				<div className={ classes } style={ style }>
					{ VIDEO_BACKGROUND_TYPE === backgroundType && url && ( <video
						className="wp-block-cover__video-background"
						autoPlay
						muted
						loop
						src={ url }
					/> ) }
					{ ! RichText.isEmpty( title ) && (
						<RichText.Content tagName="p" className="wp-block-cover-text" value={ title } />
					) }
				</div>
			);
		},

		migrate( attributes ) {
			return [
				omit( attributes, [ 'title', 'contentAlign' ] ),
				[
					createBlock(
						'core/paragraph',
						{
							content: attributes.title,
							align: attributes.contentAlign,
							fontSize: 'large',
							placeholder: __( 'Write title…' ),
						}
					),
				],
			];
		},
	}, {
		attributes: {
			...blockAttributes,
			title: {
				type: 'string',
				source: 'html',
				selector: 'p',
			},
			contentAlign: {
				type: 'string',
				default: 'center',
			},
			align: {
				type: 'string',
			},
		},

		supports: {
			className: false,
		},

		save( { attributes } ) {
			const { url, title, hasParallax, dimRatio, align, contentAlign, overlayColor, customOverlayColor } = attributes;
			const overlayColorClass = getColorClassName( 'background-color', overlayColor );
			const style = backgroundImageStyles( url );
			if ( ! overlayColorClass ) {
				style.backgroundColor = customOverlayColor;
			}

			const classes = classnames(
				'wp-block-cover-image',
				dimRatioToClass( dimRatio ),
				overlayColorClass,
				{
					'has-background-dim': dimRatio !== 0,
					'has-parallax': hasParallax,
					[ `has-${ contentAlign }-content` ]: contentAlign !== 'center',
				},
				align ? `align${ align }` : null,
			);

			return (
				<div className={ classes } style={ style }>
					{ ! RichText.isEmpty( title ) && (
						<RichText.Content tagName="p" className="wp-block-cover-image-text" value={ title } />
					) }
				</div>
			);
		},
	}, {
		attributes: {
			...blockAttributes,
			align: {
				type: 'string',
			},
			title: {
				type: 'string',
				source: 'html',
				selector: 'h2',
			},
			contentAlign: {
				type: 'string',
				default: 'center',
			},
		},

		save( { attributes } ) {
			const { url, title, hasParallax, dimRatio, align } = attributes;
			const style = backgroundImageStyles( url );
			const classes = classnames(
				dimRatioToClass( dimRatio ),
				{
					'has-background-dim': dimRatio !== 0,
					'has-parallax': hasParallax,
				},
				align ? `align${ align }` : null,
			);

			return (
				<section className={ classes } style={ style }>
					<RichText.Content tagName="h2" value={ title } />
				</section>
			);
		},
	} ],
};
