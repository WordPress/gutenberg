/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RovingTabIndexItem from './roving-tab-index-item';
import type { RovingTabIndexItemProps } from './types';

function UnforwardedTreeGridItem(
	{ children, ...props }: RovingTabIndexItemProps,
	ref: React.ForwardedRef< any >
) {
	return (
		<RovingTabIndexItem ref={ ref } { ...props }>
			{ children }
		</RovingTabIndexItem>
	);
}

/**
 * `TreeGridItem` is used to create a tree hierarchy.
 * It is not a visually styled component, but instead helps with adding
 * keyboard navigation and roving tab index behaviors to tree grid structures.
 *
 * @see {@link https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html}
 */
export const TreeGridItem = forwardRef( UnforwardedTreeGridItem );

export default TreeGridItem;
