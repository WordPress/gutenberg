/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( {
	attributes: {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
		fontSize,
		customFontSize,
		orientation,
		itemsJustification,
	},
} ) {
	const classes = classnames( {
		// TODO: migrate rgbTextColor -> customTextColor, rgbBackgroundColor -> customBackgroundColor
		'has-text-color': textColor || customTextColor,
		[ `has-${ textColor }-color` ]: textColor,
		'has-background': backgroundColor || customBackgroundColor,
		[ `has-${ backgroundColor }-background-color` ]: backgroundColor,
		[ `has-${ fontSize }-font-size` ]: fontSize,
		'is-vertical': orientation === 'vertical',
		[ `items-justified-${ itemsJustification }` ]: itemsJustification,
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
		<nav className={ classes } style={ style }>
			<ul className="wp-block-navigation__container">
				<InnerBlocks.Content />
			</ul>
		</nav>
	);
}
