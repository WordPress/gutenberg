/**
 * Internal dependencies
 */
import { ALIGNMENTS, getAlignmentIndex } from './utils';
import { Root, Cell, Point } from './styles/alignment-control-icon-styles';

export default function AlignmentControlIcon( {
	alignment = 'center',
	size: sizeProp = 24,
	width,
	height,
	...props
} ) {
	const alignIndex = getAlignmentIndex( alignment );
	const size = sizeProp || width || height;

	return (
		<Root { ...props } size={ size }>
			{ ALIGNMENTS.map( ( align, index ) => {
				const isActive = alignIndex === index;
				return (
					<Cell tabIndex={ -1 } key={ align }>
						<Point isActive={ isActive } />
					</Cell>
				);
			} ) }
		</Root>
	);
}
