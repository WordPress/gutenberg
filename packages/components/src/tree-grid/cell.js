/**
 * External dependencies
 */
import { isFunction } from 'lodash';

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

function TreeGridCell( { children, ...props }, ref ) {
	const treeGridState = useTreeGridContext();

	// Using a function as a child indicates that the
	// child renders a focusable element within a cell.
	// When a treegrid cell has a child focusable, the
	// cell itself should not be focusable.
	if ( isFunction( children ) ) {
		const { className, colSpan, ...compositeProps } = props;

		return (
			<td role="gridcell" className={ className } colSpan={ colSpan }>
				<CompositeItem children={ children } { ...compositeProps } />
			</td>
		);
	}

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
