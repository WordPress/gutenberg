/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, getColorClassName } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		verticalAlignment,
		backgroundColor,
		customBackgroundColor,
		textColor,
		customTextColor,
	} = attributes;

	const backgroundClass = getColorClassName(
		'background-color',
		backgroundColor
	);

	const textClass = getColorClassName( 'color', textColor );

	const className = classnames( {
		'has-background': backgroundColor || customBackgroundColor,
		'has-text-color': textColor || customTextColor,
		[ backgroundClass ]: backgroundClass,
		[ textClass ]: textClass,
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const style = {
		backgroundColor: backgroundClass ? undefined : customBackgroundColor,
		color: textClass ? undefined : customTextColor,
	};

	return (
		<div className={ className ? className : undefined } style={ style }>
			<InnerBlocks.Content />
		</div>
	);
}
