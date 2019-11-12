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

export default function separatorSave( { attributes } ) {
	const {
		color,
		customColor,
	} = attributes;

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
	};

	return ( <hr
		className={ separatorClasses }
		style={ separatorStyle }
	/> );
}
