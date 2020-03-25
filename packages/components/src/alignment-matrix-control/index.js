/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
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
	getAlignmentFlexProps,
	getNextIndexFromDirection,
} from './utils';
import { Root, Cell, Point } from './styles/alignment-matrix-control-styles';
import { useControlledState } from '../utils/hooks';
import AlignmentMatrixControlIcon from './icon';

// TODO: Account for RTL alignments
export default function AlignmentMatrixControl( {
	hasFocusBorder = true,
	onChange = noop,
	onKeyDown = noop,
	value = 'center',
	...props
} ) {
	const [ alignIndex, setAlignIndex ] = useControlledState(
		getAlignmentIndex( value )
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

	/**
	 * Keydown event is handled on the native node element rather than
	 * on the React Element. This resolves interaction conflicts when
	 * integrated with other components, such as Toolbar.
	 */
	useEffect( () => {
		const node = nodeRef.current;
		if ( node ) {
			node.addEventListener( 'keydown', handleOnKeyDown );
		}

		return () => {
			if ( node ) {
				node.removeEventListener( 'keydown', handleOnKeyDown );
			}
		};
	}, [ handleOnKeyDown ] );

	return (
		<Root
			{ ...props }
			hasFocusBorder={ hasFocusBorder }
			ref={ nodeRef }
			tabIndex={ 0 }
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

AlignmentMatrixControl.Icon = AlignmentMatrixControlIcon;
AlignmentMatrixControl.icon = <AlignmentMatrixControlIcon />;
AlignmentMatrixControl.__getAlignmentFlexProps = getAlignmentFlexProps;
