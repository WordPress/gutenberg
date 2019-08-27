/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, getColorClassName } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { backgroundColor, customBackgroundColor } = attributes;

	const backgroundClass = getColorClassName( 'background-color', backgroundColor );
	const className = classnames( backgroundClass, {
		'has-background': backgroundColor || customBackgroundColor,
	} );

	const styles = {
		backgroundColor: backgroundClass ? undefined : customBackgroundColor,
	};

	return (
		<div className={ className } style={ styles }>
			<div className="wp-block-group__inner-container">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
