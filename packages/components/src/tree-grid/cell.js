/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeGridItem from './item';

export default forwardRef( function TreeGridCell(
	{ children, withoutGridItem = false, ...props },
	ref
) {
	return (
		<div { ...props } role="gridcell">
			{ withoutGridItem ? (
				children
			) : (
				<TreeGridItem ref={ ref }>{ children }</TreeGridItem>
			) }
		</div>
	);
} );
