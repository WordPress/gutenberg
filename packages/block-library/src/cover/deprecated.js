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
	InnerBlocks,
	__experimentalGetGradientClass,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	backgroundImageStyles,
	dimRatioToClass,
} from './shared';

const blockAttributes = {
	url: {
		type: 'string',
	},
	id: {
		type: 'number',
	},
	hasParallax: {
		type: 'boolean',
		default: false,
	},
	dimRatio: {
		type: 'number',
		default: 50,
	},
	overlayColor: {
		type: 'string',
	},
	customOverlayColor: {
		type: 'string',
	},
	backgroundType: {
		type: 'string',
		default: 'image',
	},
	focalPoint: {
		type: 'object',
	},
};

const deprecated = [
	{
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
			minHeight: {
				type: 'number',
			},
			gradient: {
				type: 'string',
			},
			customGradient: {
				type: 'string',
			},
		},
		save( { attributes } ) {
			const {
				backgroundType,
				gradient,
				customGradient,
				customOverlayColor,
				dimRatio,
				focalPoint,
				hasParallax,
				overlayColor,
				url,
				minHeight,
			} = attributes;
			const overlayColorClass = getColorClassName( 'background-color', overlayColor );
			const gradientClass = __experimentalGetGradientClass( gradient );

			const style = backgroundType === IMAGE_BACKGROUND_TYPE ?
				backgroundImageStyles( url ) :
				{};
			if ( ! overlayColorClass ) {
				style.backgroundColor = customOverlayColor;
			}
			if ( focalPoint && ! hasParallax ) {
				style.backgroundPosition = `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`;
			}
			if ( customGradient && ! url ) {
				style.background = customGradient;
			}
			style.minHeight = minHeight || undefined;

			const classes = classnames(
				dimRatioToClass( dimRatio ),
				overlayColorClass,
				{
					'has-background-dim': dimRatio !== 0,
					'has-parallax': hasParallax,
					'has-background-gradient': customGradient,
					[ gradientClass ]: ! url && gradientClass,
				},
			);

			return (
				<div className={ classes } style={ style }>
					{ url && ( gradient || customGradient ) && dimRatio !== 0 && (
						<span
							aria-hidden="true"
							className={ classnames(
								'wp-block-cover__gradient-background',
								gradientClass
							) }
							style={ customGradient ? { background: customGradient } : undefined }
						/>
					) }
					{ VIDEO_BACKGROUND_TYPE === backgroundType && url && ( <video
						className="wp-block-cover__video-background"
						autoPlay
						muted
						loop
						src={ url }
					/> ) }
					<div className="wp-block-cover__inner-container">
						<InnerBlocks.Content />
					</div>
				</div>
			);
		},
	},
	{
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
		migrate( attributes ) {
			return [
				omit( attributes, [ 'title', 'contentAlign', 'align' ] ),
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
				selector: 'h2',
			},
			align: {
				type: 'string',
			},
			contentAlign: {
				type: 'string',
				default: 'center',
			},
		},
		supports: {
			className: false,
		},
		save( { attributes } ) {
			const { url, title, hasParallax, dimRatio, align } = attributes;
			const style = backgroundImageStyles( url );
			const classes = classnames(
				'wp-block-cover-image',
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
		migrate( attributes ) {
			return [
				omit( attributes, [ 'title', 'contentAlign', 'align' ] ),
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
	},
];

export default deprecated;
