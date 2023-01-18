/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useListViewScrollIntoView from './use-list-view-scroll-into-view';

/**
 * Renders a placeholder row with a single cell. This is used within the list view
 * branch to render a placeholder for the leaf row, which is only rendered when
 * the leaf is not visible. This results in simpler rendering logic for the leaf
 * when it is outside of the currently visible area of the list view, while
 * ensuring that the vertical space is reserved for the leaf.
 *
 * @param {Object}   props                   Component props.
 * @param {boolean}  props.isSelected        Children to be rendered.
 * @param {string[]} props.selectedClientIds Callback to fire when row is expanded.
 */
export default function ListViewLeafPlaceholder( {
	isSelected,
	selectedClientIds,
} ) {
	// For long lists where the selected item may fall outside of the current window,
	// pass a reference to the corresponding placeholder row for the selected item.
	// The "real" selected item is also observed in ListViewBlock, when rendered.
	const rowItemRef = useRef();
	useListViewScrollIntoView( {
		isSelected,
		rowItemRef,
		selectedClientIds,
	} );

	return (
		<tr ref={ rowItemRef }>
			<td className="block-editor-list-view-placeholder" />
		</tr>
	);
}
