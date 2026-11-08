import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import type { TreeGridRowProps } from './types';
import { useValidateTreeGridStructure } from './use-validate-tree-grid-structure';

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
	const rowRef = useRef< HTMLTableRowElement >( null );
	const refs = useMergeRefs( [ rowRef, ref ] );
	useValidateTreeGridStructure( 'TreeGridRow', rowRef );

	return (
		<tr
			{ ...props }
			ref={ refs }
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
TreeGridRow.displayName = 'TreeGridRow';

export default TreeGridRow;
