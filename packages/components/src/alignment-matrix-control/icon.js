/**
 * External dependencies
 */
import classnames from 'classnames';

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
	className,
	disablePointerEvents = true,
	height,
	size: sizeProp = 24,
	value = 'center',
	width,
	...props
} ) {
	const alignIndex = getAlignmentIndex( value );
	const size = sizeProp || width || height;

	const classes = classnames(
		'component-alignment-matrix-control-icon',
		className
	);

	return (
		<Root
			{ ...props }
			className={ classes }
			disablePointerEvents={ disablePointerEvents }
			role="presentation"
			size={ size }
		>
			{ ALIGNMENTS.map( ( align, index ) => {
				const isActive = alignIndex === index;

				return (
					<Cell key={ align }>
						<Point isActive={ isActive } />
					</Cell>
				);
			} ) }
		</Root>
	);
}
