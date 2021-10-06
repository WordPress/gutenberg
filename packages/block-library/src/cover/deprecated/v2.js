/**
 * External dependencies
 */
import { omit } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { RichText, getColorClassName } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	backgroundImageStyles,
	dimRatioToClass,
	blockAttributes,
} from './shared';

export default {
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
		const {
			url,
			title,
			hasParallax,
			dimRatio,
			align,
			contentAlign,
			overlayColor,
			customOverlayColor,
		} = attributes;
		const overlayColorClass = getColorClassName(
			'background-color',
			overlayColor
		);
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
			align ? `align${ align }` : null
		);

		return (
			<div className={ classes } style={ style }>
				{ ! RichText.isEmpty( title ) && (
					<RichText.Content
						tagName="p"
						className="wp-block-cover-image-text"
						value={ title }
					/>
				) }
			</div>
		);
	},
	migrate( attributes ) {
		return [
			omit( attributes, [ 'title', 'contentAlign', 'align' ] ),
			[
				createBlock( 'core/paragraph', {
					content: attributes.title,
					align: attributes.contentAlign,
					fontSize: 'large',
					placeholder: __( 'Write title…' ),
				} ),
			],
		];
	},
};
