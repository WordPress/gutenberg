/**
 * Internal dependencies
 */
import TreeGridItem from './item';

export default function TreeGridCell( {
	children,
	withoutGridItem = false,
	...props
} ) {
	return (
		<td { ...props } role="gridcell">
			{ withoutGridItem ? (
				children
			) : (
				<TreeGridItem>{ children }</TreeGridItem>
			) }
		</td>
	);
}
