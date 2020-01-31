/**
 * Internal dependencies
 */
import { RovingTabIndexItem } from '../roving-tab-index';

export default function TreeGridCell( { children, ...props } ) {
	return (
		<td role="gridcell" { ...props }>
			<RovingTabIndexItem>
				{ children }
			</RovingTabIndexItem>
		</td>
	);
}
