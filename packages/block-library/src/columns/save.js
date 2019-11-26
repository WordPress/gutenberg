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
	const wrapperClasses = classnames( {
		'has-background': ( backgroundClass || customBackgroundColor ),
		[ backgroundClass ]: backgroundClass,
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );
	const style = {
		backgroundColor: backgroundClass ? undefined : customBackgroundColor,
	};

	return (
		<div className={ wrapperClasses } style={ style }>
			<InnerBlocks.Content />
		</div>
	);
}
