/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getColorClass, InnerBlocks } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import edit, {
	dimRatioToClass,
	backgroundImageStyles,
} from './edit';

import './style.scss';

export const name = 'storypage/section';

export const settings = {
	title: __( 'Section' ),

	icon: 'editor-table',

	category: 'storypage',

	attributes: {
		maxWidth: {
			type: 'string',
			default: '',
		},
		hasImage: {
			type: 'boolean',
			default: false,
		},
		backgroundColor: {
			type: 'string',
		},
		customBackgroundColor: {
			type: 'string',
		},
		id: {
			type: 'number',
		},
		url: {
			type: 'string',
		},
		hasParallax: {
			type: 'boolean',
			default: false,
		},
		dimRatio: {
			type: 'number',
			default: 50,
		},
		data: {
			type: 'object',
			default: {},
		},
	},

	description: __( 'Add a block that wraps content, then add whatever content blocks you\'d like.' ),

	edit,

	save( { attributes, className } ) {
		const {
			maxWidth,
			hasImage,
			backgroundColor,
			customBackgroundColor,
			url,
			hasParallax,
			dimRatio,
			data,
		} = attributes;

		const backgroundClass = getColorClass( 'background-color', backgroundColor );

		const classes = classnames(
			className,
			hasImage ? dimRatioToClass( dimRatio ) : '',
			{
				'has-max-width': maxWidth !== '',
				'has-background-dim': hasImage && dimRatio !== 0,
				'has-parallax': hasImage && hasParallax,
				'has-background': ! hasImage && ( backgroundColor || customBackgroundColor ),
				[ backgroundClass ]: ! hasImage && backgroundClass,
			}
		);

		const style = hasImage ? backgroundImageStyles( url ) : {
			backgroundColor: backgroundClass ? undefined : customBackgroundColor,
		};
		style.maxWidth = maxWidth ? maxWidth : '';

		return (
			<div className={ classes } style={ style } { ...data }>
				<div className="wp-block-storypage-section-content">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},
};
