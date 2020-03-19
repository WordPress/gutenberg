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
	const className = classnames( backgroundClass, textClass, {
		'has-text-color': textColor || customTextColor,
		'has-background': backgroundColor || customBackgroundColor,
	} );

	const styles = {
		backgroundColor: backgroundClass ? undefined : customBackgroundColor,
		color: textClass ? undefined : customTextColor,
	};

	return (
		<div className={ className } style={ styles }>
			<div className="wp-block-group__inner-container">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
