/**
 * Internal dependencies
 */
import { Composite } from '../composite';
import Tooltip from '../tooltip';
import { VisuallyHidden } from '../visually-hidden';

/**
 * Internal dependencies
 */
import { ALIGNMENT_LABEL } from './utils';
import { Cell as CellView, Point } from './styles';
import type { AlignmentMatrixControlCellProps } from './types';
import type { WordPressComponentProps } from '../context';

export default function Cell( {
	id,
	value,
	...props
}: WordPressComponentProps< AlignmentMatrixControlCellProps, 'span', false > ) {
	return (
		<Tooltip text={ ALIGNMENT_LABEL[ value ] }>
			<Composite.Item
				id={ id }
				render={ <CellView { ...props } role="gridcell" /> }
			>
				{ /* VoiceOver needs a text content to be rendered within grid cell,
			otherwise it'll announce the content as "blank". So we use a visually
			hidden element instead of aria-label. */ }
				<VisuallyHidden>{ value }</VisuallyHidden>
				<Point role="presentation" />
			</Composite.Item>
		</Tooltip>
	);
}
