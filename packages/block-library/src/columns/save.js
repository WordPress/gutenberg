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
	} = attributes;

	const backgroundClass = getColorClassName(
		'background-color',
		backgroundColor
	);

	const className = classnames( {
		'has-background': backgroundColor || customBackgroundColor,
		[ backgroundClass ]: backgroundClass,
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const style = {
		backgroundColor: backgroundClass ? undefined : customBackgroundColor,
	};

	return (
		<div className={ className ? className : undefined } style={ style }>
			<InnerBlocks.Content />
		</div>
	);
}
