/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';
import type { TreeGridRowProps } from './types';

function UnforwardedTreeGridRow(
	{
		children,
		level,
		positionInSet,
		setSize,
		isExpanded,
		...props
	}: WordPressComponentProps< TreeGridRowProps, 'tr', false >,
	ref: React.ForwardedRef< HTMLTableRowElement >
) {
	return (
		<tr
			{ ...props }
			ref={ ref }
			role="row"
			aria-level={ level }
			aria-posinset={ positionInSet }
			aria-setsize={ setSize }
			aria-expanded={ isExpanded }
		>
			{ children }
		</tr>
	);
}

/**
 * `TreeGridRow` is used to create a tree hierarchy.
 * It is not a visually styled component, but instead helps with adding
 * keyboard navigation and roving tab index behaviors to tree grid structures.
 *
 * @see {@link https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html}
 */
export const TreeGridRow = forwardRef( UnforwardedTreeGridRow );

export default TreeGridRow;
