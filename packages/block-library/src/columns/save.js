/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, getColorClassName } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { verticalAlignment, backgroundColor, customBackgroundColor } = attributes;

	const backgroundClass = getColorClassName( 'background-color', backgroundColor );
	const wrapperClasses = classnames( backgroundClass, {
		'has-background': backgroundColor || customBackgroundColor,
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const styles = {
		backgroundColor: backgroundClass ? undefined : customBackgroundColor,
	};

	return (
		<div className={ wrapperClasses } style={ styles }>
			<InnerBlocks.Content />
		</div>
	);
}
