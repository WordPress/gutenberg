/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
} from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import getActiveStyle from './getActiveStyle';
import { settings } from './index';

export default function separatorSave( { attributes } ) {
	const {
		color,
		customColor,
		dotSize,
		dotSpacing,
		lineThickness,
		className,
	} = attributes;
	let { isDots, isLine } = false;
	if ( className ) {
		const currentStyle = getActiveStyle( settings.styles, className ).name;
		isDots = currentStyle === 'dots';
		isLine = currentStyle === 'wide' || currentStyle === 'default';
	}

	// the hr support changing color using border-color, since border-color
	// is not yet supported in the color palette, we use background-color
	const backgroundClass = getColorClassName( 'background-color', color );
	// the dots styles uses text for the dots, to change those dots color is
	// using color, not backgroundColor
	const colorClass = getColorClassName( 'color', color );

	const separatorClasses = classnames( {
		'has-text-color has-background': color || customColor,
		[ backgroundClass ]: backgroundClass,
		[ colorClass ]: colorClass,
	} );

	const separatorStyle = {
		backgroundColor: backgroundClass ? undefined : customColor,
		color: colorClass ? undefined : customColor,
		fontSize: dotSize || undefined,
		letterSpacing: dotSpacing || dotSize,
		paddingLeft: ( isDots ? ( dotSpacing || dotSize ) : undefined ),
		borderWidth: lineThickness,
		height: isLine ? lineThickness : undefined,
	};

	return ( <hr
		className={ separatorClasses }
		style={ separatorStyle }
	/> );
}
