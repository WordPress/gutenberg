/**
 * External dependencies
 */
import { unstable_CompositeItem as CompositeItem } from 'reakit/Composite';

/**
 * Internal dependencies
 */
import VisuallyHidden from '../visually-hidden';

/**
 * Internal dependencies
 */
import {
	Cell as CellView,
	Point,
} from './styles/alignment-matrix-control-styles';

export default function Cell( { isActive = false, value, ...props } ) {
	return (
		<CompositeItem as={ CellView } role="gridcell" { ...props }>
			{ /* VoiceOver needs a text content to be rendered within grid cell,
			otherwise it'll announce the content as "blank". So we use a visually
			hidden element instead of aria-label. */ }
			<VisuallyHidden>{ value }</VisuallyHidden>
			<Point isActive={ isActive } role="presentation" />
		</CompositeItem>
	);
}
