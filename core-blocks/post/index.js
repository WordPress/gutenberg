/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getColorClass,
	RichText,
} from '@wordpress/editor';
/**
 * Internal dependencies
 */
import '../paragraph/style.scss';
import '../cover-image/style.scss';
import edit, {
	dimRatioToClass,
	backgroundImageStyles,
} from './edit';

import './style.scss';

const blockAttributes = {
	url: {
		type: 'string',
	},
	id: { // mediaId
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
	title: { // content
		type: 'array',
		source: 'children',
		selector: 'p',
		default: [],
	},
	textAlign: { // align
		type: 'string',
	},
	dropCap: {
		type: 'boolean',
		default: false,
	},
	textColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
	},
	backgroundColor: {
		type: 'string',
	},
	customBackgroundColor: {
		type: 'string',
	},
	fontSize: {
		type: 'string',
		default: 'regular',
	},
	customFontSize: {
		type: 'number',
	},
	link: {
		type: 'string',
	},
};

export const name = 'custom/post';

export const settings = {
	title: __( 'Post' ),

	description: __( 'Post has an image and a title.' ),

	icon: 'universal-access-alt',

	category: 'common',

	attributes: blockAttributes,

	edit,

	save( { attributes, className } ) {
		const {
			url,
			hasParallax,
			dimRatio,
			title,
			textAlign,
			dropCap,
			textColor,
			customTextColor,
			backgroundColor,
			customBackgroundColor,
			fontSize,
			customFontSize,
			link,
		} = attributes;

		// Image
		const imageStyle = backgroundImageStyles( url );
		const imageClasses = classnames(
			'wp-block-cover-image',
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			},
		);

		// Title
		const textClass = getColorClass( 'color', textColor );
		const backgroundClass = getColorClass( 'background-color', backgroundColor );
		const fontSizeClass = fontSize && `is-${ fontSize }-text`;

		const textClasses = classnames( {
			'has-background': backgroundColor || customBackgroundColor,
			'has-drop-cap': dropCap,
			[ fontSizeClass ]: fontSizeClass,
			[ textClass ]: textClass,
			[ backgroundClass ]: backgroundClass,
		} );

		const textStyle = {
			backgroundColor: backgroundClass ? undefined : customBackgroundColor,
			color: textClass ? undefined : customTextColor,
			fontSize: fontSizeClass ? undefined : customFontSize,
			textAlign,
		};

		const post = (
			<div className={ className }>
				<div
					className={ imageClasses }
					style={ imageStyle }
				></div>
				<RichText.Content
					tagName="p"
					style={ textStyle }
					className={ textClasses ? textClasses : undefined }
					value={ title }
				/>
			</div>
		);

		return ( link ? <a href={ link }>{ post }</a> : post );
	},
};
