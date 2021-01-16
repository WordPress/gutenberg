/**
 * External dependencies
 */

import { some } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useReducer } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ControlPoints from './control-points';
import { getHorizontalRelativeGradientPosition } from './utils';
import {
	INSERT_POINT_WIDTH,
	MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_POINT,
} from './constants';

function customGradientBarReducer( state, action ) {
	switch ( action.type ) {
		case 'MOVE_INSERTER':
			if ( state.id === 'IDLE' || state.id === 'MOVING_INSERTER' ) {
				return {
					id: 'MOVING_INSERTER',
				};
			}
			break;
		case 'STOP_INSERTER_MOVE':
			if ( state.id === 'MOVING_INSERTER' ) {
				return {
					id: 'IDLE',
				};
			}
			break;
		case 'OPEN_INSERTER':
			if ( state.id === 'MOVING_INSERTER' ) {
				return {
					id: 'INSERTING_CONTROL_POINT',
				};
			}
			break;
		case 'CLOSE_INSERTER':
			if ( state.id === 'INSERTING_CONTROL_POINT' ) {
				return {
					id: 'IDLE',
				};
			}
			break;
		case 'START_CONTROL_CHANGE':
			if ( state.id === 'IDLE' ) {
				return {
					id: 'MOVING_CONTROL_POINT',
				};
			}
			break;
		case 'STOP_CONTROL_CHANGE':
			if ( state.id === 'MOVING_CONTROL_POINT' ) {
				return {
					id: 'IDLE',
				};
			}
			break;
	}
	return state;
}
const customGradientBarReducerInitialState = { id: 'IDLE' };

export default function CustomGradientBar( {
	background,
	hasGradient,
	value: controlPoints,
	onChange,
} ) {
	const gradientPickerDomRef = useRef();
	const insertPositionRef = useRef();

	const [ gradientBarState, gradientBarStateDispatch ] = useReducer(
		customGradientBarReducer,
		customGradientBarReducerInitialState
	);

	function onMouseEnter() {
		gradientBarStateDispatch( { type: 'MOVE_INSERTER' } );
	}

	function onMouseMove( event ) {
		insertPositionRef.current = getHorizontalRelativeGradientPosition(
			event.clientX,
			gradientPickerDomRef.current,
			INSERT_POINT_WIDTH
		);

		// If the insert point is close to an existing control point don't show it.
		if (
			gradientBarState.id === 'MOVING_INSERTER' &&
			some( controlPoints, ( { position } ) => {
				return (
					Math.abs( insertPositionRef.current - position ) <
					MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_POINT
				);
			} )
		) {
			gradientBarStateDispatch( { type: 'STOP_INSERTER_MOVE' } );
		}
	}

	function onMouseLeave() {
		gradientBarStateDispatch( { type: 'STOP_INSERTER_MOVE' } );
	}

	const isMovingInserter = gradientBarState.id === 'MOVING_INSERTER';
	const isInsertingControlPoint =
		gradientBarState.id === 'INSERTING_CONTROL_POINT';

	return (
		<div
			ref={ gradientPickerDomRef }
			className={ classnames(
				'components-custom-gradient-picker__gradient-bar',
				{ 'has-gradient': hasGradient }
			) }
			style={ { background } }
			onMouseEnter={ onMouseEnter }
			onMouseMove={ onMouseMove }
			onMouseLeave={ onMouseLeave }
		>
			<div className="components-custom-gradient-picker__markers-container">
				{ ( isMovingInserter || isInsertingControlPoint ) && (
					<ControlPoints.InsertPoint
						insertPosition={ insertPositionRef.current }
						value={ controlPoints }
						onChange={ onChange }
						onOpenInserter={ () => {
							gradientBarStateDispatch( {
								type: 'OPEN_INSERTER',
							} );
						} }
						onCloseInserter={ () => {
							gradientBarStateDispatch( {
								type: 'CLOSE_INSERTER',
							} );
						} }
					/>
				) }
				<ControlPoints
					gradientPickerDomRef={ gradientPickerDomRef }
					ignoreMarkerPosition={
						isInsertingControlPoint
							? gradientBarState.insertPosition
							: undefined
					}
					value={ controlPoints }
					onChange={ onChange }
					onStartControlPointChange={ () => {
						gradientBarStateDispatch( {
							type: 'START_CONTROL_CHANGE',
						} );
					} }
					onStopControlPointChange={ () => {
						gradientBarStateDispatch( {
							type: 'STOP_CONTROL_CHANGE',
						} );
					} }
				/>
			</div>
		</div>
	);
}
