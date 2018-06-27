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
// import '../paragraph/style.scss';
// import '../cover-image/style.scss';
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
	hasImage: {
		type: 'boolean',
		default: true,
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
	textColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
	},
	fontSize: {
		type: 'string',
		default: 'large',
	},
	customFontSize: {
		type: 'number',
	},
	link: {
		type: 'string',
	},
};

export const name = 'storypage/post';

export const settings = {
	title: __( 'Post' ),

	description: __( 'Post has an image and a title.' ),

	icon: 'universal-access-alt',

	category: 'storypage',

	attributes: blockAttributes,

	edit,

	save( { attributes, className } ) {
		const {
			url,
			hasImage,
			hasParallax,
			dimRatio,
			title,
			textColor,
			customTextColor,
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
		const fontSizeClass = fontSize && `is-${ fontSize }-text`;

		const textClasses = classnames( {
			[ fontSizeClass ]: fontSizeClass,
			[ textClass ]: textClass,
		} );

		const textStyle = {
			color: textClass ? undefined : customTextColor,
			fontSize: fontSizeClass ? undefined : customFontSize,
		};

		const post = (
			<div className={ className }>
				{ hasImage &&
					<div
						className={ imageClasses }
						style={ imageStyle }
					></div>
				}
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
