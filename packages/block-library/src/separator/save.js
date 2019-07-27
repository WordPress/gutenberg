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

export default function save( { attributes } ) {
	const {
		backgroundColor,
		customBackgroundColor,
	} = attributes;

	const backgroundClass = getColorClassName( 'background-color', backgroundColor );

	const separatorClasses = classnames( {
		'has-background': backgroundColor || customBackgroundColor,
		[ backgroundClass ]: backgroundClass,
	} );

	const separatorStyle = {
		backgroundColor: backgroundClass ? undefined : customBackgroundColor,
	};
	return <hr
		className={ separatorClasses }
		style={ separatorStyle }
	/>;
}
