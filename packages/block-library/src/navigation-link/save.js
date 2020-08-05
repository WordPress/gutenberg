/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { ItemSubmenuIcon } from './icons';

export default function save( {
	attributes: { url, opensInNewTab, rel, nofollow, label, showSubmenuIcon },
	context: {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
		fontSize,
		customFontSize,
	},
	innerBlocks,
} ) {
	const classes = classnames( {
		'has-text-color': textColor || customTextColor,
		[ `has-${ textColor }-color` ]: textColor,
		'has-background': backgroundColor || customBackgroundColor,
		[ `has-${ backgroundColor }-background-color` ]: backgroundColor,
		[ `has-${ fontSize }-font-size` ]: fontSize,
		'has-child': innerBlocks.length > 0,
	} );

	const style = {};
	if ( ! textColor && customTextColor ) {
		style.color = customTextColor;
	}
	if ( ! backgroundColor && customBackgroundColor ) {
		style.backgroundColor = customBackgroundColor;
	}
	if ( ! fontSize && customFontSize ) {
		style.fontSize = fontSize;
	}

	return (
		<li className={ classes } style={ style }>
			<a
				className="wp-block-navigation-link__content"
				href={ url }
				target={ opensInNewTab ? '_blank' : undefined }
				rel={ rel || ( nofollow ? 'nofollow' : undefined ) }
			>
				<RichText.Content
					tagName="span"
					className="wp-block-navigation-link__label"
					value={ label }
				/>
			</a>
			{ showSubmenuIcon && (
				<span className="wp-block-navigation-link__submenu-icon">
					<ItemSubmenuIcon />
				</span>
			) }
			{ /* TODO: This class name should be navigation-link, not navigation. */ }
			<ul className="wp-block-navigation__container">
				<InnerBlocks.Content />
			</ul>
		</li>
	);
}
