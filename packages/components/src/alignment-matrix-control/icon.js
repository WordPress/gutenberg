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
	height,
	size: sizeProp = BASE_SIZE,
	style = {},
	value = 'center',
	width,
	...props
} ) {
	const alignIndex = getAlignmentIndex( value );
	/**
	 * When this component is used on it's own,
	 * the size prop is preferred.
	 *
	 * Example:
	 * <AligmentMatrixControlIcon size={ 20 } />
	 *
	 * However, when used with the <Icon /> component from @wordpress/icons,
	 * width/height are passed in from <Icon />.
	 *
	 * Example:
	 * <Icon icon={ AlignmmentMatrixControlIcon } />
	 */
	const size = width || height || sizeProp;
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
