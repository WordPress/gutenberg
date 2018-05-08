/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import './editor.scss';
import PostBlock, { FONT_SIZES, dimRatioToClass, backgroundImageStyles } from './block';

const blockAttributes = {
	title: {
		type: 'array',
		source: 'children',
		selector: 'p',
	},
	url: {
		type: 'string',
	},
	textAlign: {
		type: 'string',
		default: 'left',
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
		default: 0,
	},
	textColor: {
		type: 'string',
	},
	backgroundColor: {
		type: 'string',
	},
	fontSize: {
		type: 'string',
	},
	customFontSize: {
		type: 'number',
	},
	mediaId: {
		type: 'number',
	},
};

export const name = 'custom/post';

export const settings = {
	title: __( 'Post' ),

	description: __( 'Post has an image and a title.' ),

	icon: 'universal-access-alt',

	category: 'common',

	attributes: blockAttributes,

	edit: PostBlock,

	save( { attributes, className } ) {
		const { url, title, textAlign, hasParallax, dimRatio, textColor, backgroundColor, fontSize, customFontSize, mediaId } = attributes;
		const imageStyle = backgroundImageStyles( url );
		const imageClasses = classnames(
			'wp-block-cover-image',
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			},
		);

		const textStyle = {
			backgroundColor: backgroundColor,
			color: textColor,
			fontSize: ! fontSize && customFontSize ? customFontSize : undefined,
			textAlign: textAlign,
		};

		const textClasses = classnames( {
			'has-background': backgroundColor,
			[ `is-${ fontSize }-text` ]: fontSize && FONT_SIZES[ fontSize ],
		} );

		return (
			<div className={ className }>
				<section className={ imageClasses } style={ imageStyle } />
				<RichText.Content tagName="p" className={ textClasses } style={ textStyle } value={ title } />
			</div>
		);
	},
};
