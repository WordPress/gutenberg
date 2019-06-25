/**
 * External dependencies
 */
import classnames from 'classnames';
import { get, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	RichText,
	getColorObjectByAttributeValues,
} from '@wordpress/block-editor';
import {
	select,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SOLID_COLOR_CLASS } from './shared';

export default function save( { attributes } ) {
	const { mainColor, customMainColor, textColor, customTextColor, value, citation, className } = attributes;
	const isSolidColorStyle = includes( className, SOLID_COLOR_CLASS );

	let figureClass, figureStyles;
	// Is solid color style
	if ( isSolidColorStyle ) {
		figureClass = getColorClassName( 'background-color', mainColor );
		if ( ! figureClass ) {
			figureStyles = {
				backgroundColor: customMainColor,
			};
		}
		// Is normal style and a custom color is being used ( we can set a style directly with its value)
	} else if ( customMainColor ) {
		figureStyles = {
			borderColor: customMainColor,
		};
		// Is normal style and a named color is being used, we need to retrieve the color value to set the style,
		// as there is no expectation that themes create classes that set border colors.
	} else if ( mainColor ) {
		const colors = get( select( 'core/block-editor' ).getSettings(), [ 'colors' ], [] );
		const colorObject = getColorObjectByAttributeValues( colors, mainColor );
		figureStyles = {
			borderColor: colorObject.color,
		};
	}

	const blockquoteTextColorClass = getColorClassName( 'color', textColor );
	const blockquoteClasses = textColor || customTextColor ? classnames( 'has-text-color', {
		[ blockquoteTextColorClass ]: blockquoteTextColorClass,
	} ) : undefined;
	const blockquoteStyle = blockquoteTextColorClass ? undefined : { color: customTextColor };
	return (
		<figure className={ figureClass } style={ figureStyles }>
			<blockquote className={ blockquoteClasses } style={ blockquoteStyle } >
				<RichText.Content value={ value } multiline />
				{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
			</blockquote>
		</figure>
	);
}
