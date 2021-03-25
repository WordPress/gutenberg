/**
 * Internal dependencies
 */
import { CompositeItem } from '../composite';
import Tooltip from '../tooltip';
import VisuallyHidden from '../visually-hidden';

/**
 * Internal dependencies
 */
import { ALIGNMENT_LABEL } from './utils';
import {
	Cell as CellView,
	Point,
} from './styles/alignment-matrix-control-styles';

export default function Cell( { isActive = false, value, ...props } ) {
	const tooltipText = ALIGNMENT_LABEL[ value ];

	return (
		<Tooltip text={ tooltipText }>
			<CompositeItem as={ CellView } role="gridcell" { ...props }>
				{ /* VoiceOver needs a text content to be rendered within grid cell,
			otherwise it'll announce the content as "blank". So we use a visually
			hidden element instead of aria-label. */ }
				<VisuallyHidden>{ value }</VisuallyHidden>
				<Point isActive={ isActive } role="presentation" />
			</CompositeItem>
		</Tooltip>
	);
}
