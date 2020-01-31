/**
 * Internal dependencies
 */
import { RovingTabIndexItem } from '../roving-tab-index';

export default function TreeGridCell( { children } ) {
	return (
		<RovingTabIndexItem>
			{ ( props ) => (
				<td role="gridcell" { ...props }>{ children }</td>
			) }
		</RovingTabIndexItem>

	);
}
