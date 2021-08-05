/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __unstableMotion as motion } from '../animation';

const TREE_GRID_ROW_VARIANTS = {
	init: {
		opacity: 0,
	},
	open: {
		opacity: 1,
	},
	exit: {
		opacity: 0,
	},
};

const NO_MOTION_VARIANTS = { init: false, open: false, exit: false };

function TreeGridRow(
	{
		children,
		level,
		positionInSet,
		setSize,
		isExpanded,
		motionEnabled = true,
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
			layout={ motionEnabled }
			initial={ 'init' }
			animate={ 'open' }
			exit={ 'exit' }
			variants={
				motionEnabled ? TREE_GRID_ROW_VARIANTS : NO_MOTION_VARIANTS
			}
			{ ...props }
			ref={ ref }
			role="row"
			aria-level={ level }
			aria-posinset={ positionInSet }
			aria-setsize={ setSize }
			aria-expanded={ isExpanded }
		>
			{ children }
		</motion.tr>
	);
}

export default forwardRef( TreeGridRow );
