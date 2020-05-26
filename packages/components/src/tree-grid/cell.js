/**
 * Internal dependencies
 */
import RovingTabIndexItem from './roving-tab-index-item';

export default function TreeGridCell( { children, ...props } ) {
	return (
		<td { ...props } role="gridcell">
			<RovingTabIndexItem>{ children }</RovingTabIndexItem>
		</td>
	);
}
