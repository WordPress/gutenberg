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

const BASE_SIZE = 24;

export default function AlignmentMatrixControlIcon( {
	className,
	disablePointerEvents = true,
	size = BASE_SIZE,
	style = {},
	value = 'center',
	...props
} ) {
	const alignIndex = getAlignmentIndex( value );
	const scale = ( size / BASE_SIZE ).toFixed( 2 );

	const classes = classnames(
		'component-alignment-matrix-control-icon',
		className
	);

	const styles = {
		...style,
		transform: `scale(${ scale })`,
	};

	return (
		<Root
			{ ...props }
			className={ classes }
			disablePointerEvents={ disablePointerEvents }
			role="presentation"
			size={ size }
			style={ styles }
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
