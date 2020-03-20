/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	ALIGNMENTS,
	DIRECTION,
	FLEX_ALIGNMENT_PROPS,
	getAlignmentIndex,
	getAlignmentValueFromIndex,
	getNextIndexFromDirection,
} from './utils';
import { Root, Cell, Point } from './styles/alignment-control-styles';
import { useControlledState } from '../utils/hooks';

// TODO: Account for RTL alignments
export default function AlignmentControl( {
	alignment: alignmentProp = 'center',
	onChange = noop,
	onKeyDown = noop,
	...props
} ) {
	const [ alignIndex, setAlignIndex ] = useControlledState(
		getAlignmentIndex( alignmentProp )
	);
	const nodeRef = useRef();

	const handleOnChange = ( nextIndex ) => {
		const alignName = getAlignmentValueFromIndex( nextIndex );

		setAlignIndex( nextIndex );
		onChange( alignName );
	};

	const handleOnKeyDown = ( event ) => {
		const { keyCode } = event;
		let nextIndex;

		onKeyDown( event );

		switch ( keyCode ) {
			case UP:
				event.preventDefault();
				nextIndex = getNextIndexFromDirection(
					alignIndex,
					DIRECTION.UP
				);
				handleOnChange( nextIndex );
				break;
			case DOWN:
				event.preventDefault();
				nextIndex = getNextIndexFromDirection(
					alignIndex,
					DIRECTION.DOWN
				);
				handleOnChange( nextIndex );
				break;
			case LEFT:
				event.preventDefault();
				nextIndex = getNextIndexFromDirection(
					alignIndex,
					DIRECTION.LEFT
				);
				handleOnChange( nextIndex );
				break;
			case RIGHT:
				event.preventDefault();
				nextIndex = getNextIndexFromDirection(
					alignIndex,
					DIRECTION.RIGHT
				);
				handleOnChange( nextIndex );
				break;
			default:
				break;
		}
	};

	const createHandleOnClick = ( index ) => ( event ) => {
		nodeRef.current.focus();
		event.preventDefault();
		handleOnChange( index, { flexProps: FLEX_ALIGNMENT_PROPS[ index ] } );
	};

	return (
		<Root
			{ ...props }
			tabIndex={ 0 }
			ref={ nodeRef }
			onKeyDown={ handleOnKeyDown }
		>
			{ ALIGNMENTS.map( ( align, index ) => {
				const isActive = alignIndex === index;
				return (
					<Cell
						tabIndex={ -1 }
						key={ align }
						onClick={ createHandleOnClick( index ) }
					>
						<Point isActive={ isActive } />
					</Cell>
				);
			} ) }
		</Root>
	);
}
