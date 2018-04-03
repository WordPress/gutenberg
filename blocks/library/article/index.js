/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import ArticleBlock, { FONT_SIZES, dimRatioToClass } from './block';

export const name = 'dynamic/article';

export const settings = {
	title: 'Article',

	description: __( 'Article has an image and a title.' ),

	icon: 'universal-access-alt',

	category: 'common',

	attributes: {
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
		articleId: {
			type: 'string',
		},
	},

	edit: ArticleBlock,

	save( { attributes, className } ) {
		const { url, title, textAlign, hasParallax, dimRatio, textColor, backgroundColor, fontSize, customFontSize } = attributes;

		const imageStyle = url ? { backgroundImage: `url(${ url })` } : undefined;
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
				<section className={ imageClasses ? imageClasses : undefined } style={ imageStyle }></section>
				<p className={ textClasses ? textClasses : undefined } style={ textStyle }>{ title }</p>
			</div>
		);
	},
};
