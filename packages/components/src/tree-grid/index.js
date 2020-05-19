/**
 * External dependencies
 */
import {
	unstable_useCompositeState as useCompositeState,
	unstable_Composite as Composite,
} from 'reakit/Composite';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeGridContext from './context';

function TreeGrid( { children, ...props }, ref ) {
	const treeGridState = useCompositeState();

	return (
		<TreeGridContext.Provider value={ treeGridState }>
			<Composite
				{ ...treeGridState }
				as="table"
				role="treegrid"
				ref={ ref }
				{ ...props }
			>
				<tbody>{ children }</tbody>
			</Composite>
		</TreeGridContext.Provider>
	);
}

export default forwardRef( TreeGrid );
export { default as TreeGridRow } from './row';
export { default as TreeGridCell } from './cell';
