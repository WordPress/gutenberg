/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeGridItem from './item';
import type { WordPressComponentProps } from '../context';
import type { TreeGridCellProps } from './types';

function UnforwardedTreeGridCell(
	{
		children,
		withoutGridItem = false,
		...props
	}: WordPressComponentProps< TreeGridCellProps, 'td', false >,
	ref: React.ForwardedRef< any >
) {
	return (
		<td { ...props } role="gridcell">
			{ withoutGridItem ? (
				<>
					{ typeof children === 'function'
						? children( { ...props, ref } )
						: children }
				</>
			) : (
				<TreeGridItem ref={ ref }>{ children }</TreeGridItem>
			) }
		</td>
	);
}

/**
 * `TreeGridCell` is used to create a tree hierarchy.
 * It is not a visually styled component, but instead helps with adding
 * keyboard navigation and roving tab index behaviors to tree grid structures.
 *
 * @see {@link https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html}
 */
export const TreeGridCell = forwardRef( UnforwardedTreeGridCell );

export default TreeGridCell;
