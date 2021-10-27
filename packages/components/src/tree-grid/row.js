/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __unstableMotion as motion } from '../animation';

function TreeGridRow(
	{
		children,
		level,
		positionInSet,
		setSize,
		isExpanded,
		useAnimation = false,
		...props
	},
	ref
) {
	return (
		// Disable reason: Due to an error in the ARIA 1.1 specification, the
		// aria-posinset and aria-setsize properties are not supported on row
		// elements. This is being corrected in ARIA 1.2. Consequently, the
		// linting rule fails when validating this markup.
		//
		// eslint-disable-next-line jsx-a11y/role-supports-aria-props
		<motion.tr
			layout={ useAnimation ? 'position' : false }
			ref={ ref }
			role="row"
			aria-level={ level }
			aria-posinset={ positionInSet }
			aria-setsize={ setSize }
			aria-expanded={ isExpanded }
			{ ...props }
		>
			{ children }
		</motion.tr>
	);
}

export default forwardRef( TreeGridRow );
