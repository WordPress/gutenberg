/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeGridItem from './item';
import type { WordPressComponentProps } from '../ui/context';
import type { TreeGridCellProps } from './types';

function UnforwardedTreeGridCell(
	{
		children,
		withoutGridItem,
		...props
	}: WordPressComponentProps< TreeGridCellProps, 'td', false >,
	ref: React.ForwardedRef< any >
) {
	return (
		<td { ...props } role="gridcell">
			{ withoutGridItem ? (
				children
			) : (
				<TreeGridItem ref={ ref }>{ children }</TreeGridItem>
			) }
		</td>
	);
}

export const TreeGridCell = forwardRef( UnforwardedTreeGridCell );

export default TreeGridCell;
