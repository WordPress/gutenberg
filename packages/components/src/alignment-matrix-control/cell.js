/**
 * External dependencies
 */
import { unstable_CompositeItem as CompositeItem } from 'reakit';

/**
 * Internal dependencies
 */
import {
	Cell as CellView,
	Point,
} from './styles/alignment-matrix-control-styles';

export default function Cell( { isActive = false, value, ...props } ) {
	return (
		<CompositeItem
			as={ CellView }
			aria-label={ value }
			role="gridcell"
			tabIndex={ -1 }
			{ ...props }
		>
			<Point isActive={ isActive } role="presentation" />
		</CompositeItem>
	);
}
