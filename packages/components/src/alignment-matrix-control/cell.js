/**
 * Internal dependencies
 */
import {
	Cell as CellView,
	Point,
} from './styles/alignment-matrix-control-styles';

export default function Cell( { isActive = false, value, ...props } ) {
	return (
		<CellView
			aria-selected={ isActive }
			aria-label={ value }
			role="option"
			tabIndex={ -1 }
			{ ...props }
		>
			<Point isActive={ isActive } role="presentation" />
		</CellView>
	);
}
