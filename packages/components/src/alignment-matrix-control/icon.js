/**
 * Internal dependencies
 */
import { ALIGNMENTS, getAlignmentIndex } from './utils';
import {
	Root,
	Cell,
	Point,
} from './styles/alignment-matrix-control-icon-styles';

export default function AlignmentMatrixControlIcon( {
	height,
	size: sizeProp = 24,
	value = 'center',
	width,
	...props
} ) {
	const alignIndex = getAlignmentIndex( value );
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
