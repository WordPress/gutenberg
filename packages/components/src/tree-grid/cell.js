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
import useTreeGridContext from './context';

function TreeGridCell( props, ref ) {
	const treeGridState = useTreeGridContext();
	return (
		<CompositeItem
			{ ...treeGridState }
			role="gridcell"
			as="td"
			ref={ ref }
			{ ...props }
		/>
	);
}

export default forwardRef( TreeGridCell );
