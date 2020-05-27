/**
 * External dependencies
 */
import { unstable_CompositeItem as CompositeItem } from 'reakit/Composite';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useTreeGridContext } from './context';
import TreeGridCell from './cell';

function FocusableTreeGridCell( props, ref ) {
	const treeGridState = useTreeGridContext();

	return (
		<CompositeItem
			{ ...treeGridState }
			as={ TreeGridCell }
			ref={ ref }
			{ ...props }
		/>
	);
}

export default forwardRef( FocusableTreeGridCell );
