/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

function TreeGridRow(
	{ children, level, positionInSet, setSize, isExpanded, ...props },
	ref
) {
	return (
		// Disable reason: Due to an error in the ARIA 1.1 specification, the
		// aria-posinset and aria-setsize properties are not supported on row
		// elements. This is being corrected in ARIA 1.2. Consequently, the
		// linting rule fails when validating this markup.
		//
		// eslint-disable-next-line jsx-a11y/role-supports-aria-props
		<tr
			{ ...props }
			ref={ ref }
			role="row"
			aria-level={ level }
			aria-posinset={ positionInSet }
			aria-setsize={ setSize }
			aria-expanded={ isExpanded }
		>
			{ children }
		</tr>
	);
}

export default forwardRef( TreeGridRow );
