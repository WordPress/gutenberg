/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';

function IconButton( {
	labelPosition,
	size,
	...props
}, ref ) {
	return (
		<Button
			{ ...props }
			ref={ ref }
			tooltipPosition={ labelPosition }
			iconSize={ size }
		/>
	);
}

export default forwardRef( IconButton );
