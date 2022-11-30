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
import type { AlignmentMatrixControlIconProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

const BASE_SIZE = 24;

export default function AlignmentMatrixControlIcon( {
	className,
	disablePointerEvents = true,
	size = BASE_SIZE,
	style = {},
	value = 'center',
	...props
}: WordPressComponentProps< AlignmentMatrixControlIconProps, 'div', false > ) {
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
	const iconProps = {
		className: classes,
		disablePointerEvents,
		role: 'presentation',
		// size, TODO: check if this is needed
		style: styles,
	};

	return (
		<Root { ...props } { ...iconProps }>
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
