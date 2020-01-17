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
	tooltip,
	label,
	...props
}, ref ) {
	return (
		<Button
			{ ...props }
			ref={ ref }
			tooltipPosition={ labelPosition }
			iconSize={ size }
			showTooltip={ tooltip !== undefined ? !! tooltip : undefined }
			label={ tooltip || label }
		/>
	);
}

export default forwardRef( IconButton );
