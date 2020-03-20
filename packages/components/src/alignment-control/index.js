/**
 * External dependencies
 */
import { noop } from 'lodash';
import styled from '@emotion/styled';
import { css } from '@emotion/core';

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
import { color, reduceMotion } from '../utils/style-mixins';
import { useControlledState } from '../utils/hooks';

export default function AlignmentControl( {
	alignment: alignmentProp = 'center',
	onChange = noop,
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
		<RootView tabIndex={ 0 } ref={ nodeRef } onKeyDown={ handleOnKeyDown }>
			{ ALIGNMENTS.map( ( align, index ) => {
				const isActive = alignIndex === index;
				return (
					<CellView
						tabIndex={ -1 }
						key={ align }
						onClick={ createHandleOnClick( index ) }
					>
						<DotView className="dot" isActive={ isActive } />
					</CellView>
				);
			} ) }
		</RootView>
	);
}

const RootView = styled.div`
	--maxWidth: 92px;
	border: 1px solid transparent;
	border-radius: 2px;
	max-width: var( --maxWidth );
	display: grid;
	grid-template-columns: repeat( 3, 1fr );
	grid-template-rows: repeat( 3, calc( var( --maxWidth ) / 3 ) );
	outline: none;

	&:active,
	&:focus {
		border: 1px solid ${color( 'blue.medium.focus' )};
	}
`;

const DotView = styled.div`
	width: 6px;
	height: 6px;
	margin: auto;
	transition: all 120ms linear;
	background: currentColor;
	${reduceMotion( 'transition' )};

	${( { isActive } ) =>
		css( {
			boxShadow: isActive ? `0 0 0 2px ${ color( 'black' ) }` : null,
			color: isActive ? color( 'black' ) : color( 'lightGray.800' ),
		} )}

	*:hover > & {
		${( { isActive } ) =>
			css( {
				color: isActive
					? color( 'black' )
					: color( 'blue.medium.focus' ),
			} )}
	}
`;

const CellView = styled.div`
	appearance: none;
	border: none;
	margin: 0;
	display: flex;
	position: relative;
	outline: none;
	cursor: pointer;
	align-items: center;
	justify-content: center;
	padding: 0;
`;
