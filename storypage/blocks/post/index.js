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
	id: { 			// post.id
		type: 'number',
	},
	title: { 		// post.title
		type: 'array',
		source: 'children',
		selector: 'p',
	},
	link: { 		// post.link
		type: 'string',
	},
	mediaId: { 		// post media.id
		type: 'number',
	},
	mediaUrl: { 	// post media.url
		type: 'string',
	},
	type: {
		type: 'string',
		default: 'static',
	},
	categoryId: {
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
			title,
			link,
			mediaUrl,
			// type,
			hasImage,
			hasParallax,
			dimRatio,
			textColor,
			customTextColor,
			fontSize,
			customFontSize,
		} = attributes;

		/* if ( type !== 'static' ) {
			return null;
		} */

		// Image
		const imageStyle = backgroundImageStyles( mediaUrl );
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
