/**
 * External dependencies
 */
import {
	unstable_CompositeGroup as CompositeGroup,
	unstable_useCompositeItem as useCompositeItem,
} from 'reakit/Composite';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useTreeGridContext } from './context';

function TreeGridRow(
	{ level, positionInSet, setSize, isExpanded, ...props },
	ref
) {
	const treeGridState = useTreeGridContext();

	// Combine `useCompositeItem` with `CompositeGroup` to create a row
	// that can be managed as part of the TreeGrid's roving tab index.
	const htmlProps = useCompositeItem( treeGridState, { ref, ...props } );

	return (
		// Disable reason: Due to an error in the ARIA 1.1 specification, the
		// aria-posinset and aria-setsize properties are not supported on row
		// elements. This is being corrected in ARIA 1.2. Consequently, the
		// linting rule fails when validating this markup.
		//
		// eslint-disable-next-line jsx-a11y/role-supports-aria-props
		<CompositeGroup
			{ ...treeGridState }
			role="row"
			as="tr"
			aria-expanded={ isExpanded }
			aria-level={ level }
			aria-setsize={ setSize }
			aria-posinset={ positionInSet }
			{ ...htmlProps }
		/>
	);
}

export default forwardRef( TreeGridRow );
