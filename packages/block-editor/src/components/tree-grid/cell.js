/**
 * Internal dependencies
 */
import { RovingTabIndexItem } from '../roving-tab-index';

export default function TreeGridCell( { children } ) {
	return (
		<td role="gridcell">
			<RovingTabIndexItem>
				{ children }
			</RovingTabIndexItem>
		</td>
	);
}
