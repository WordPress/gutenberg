/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useRef, useReducer } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ControlPoints from './control-points';
import { getHorizontalRelativeGradientPosition } from './utils';
import { MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_POINT } from './constants';
import type {
	CustomGradientBarProps,
	CustomGradientBarReducerState,
	CustomGradientBarReducerAction,
	CustomGradientBarIdleState,
} from '../types';
import type { MouseEventHandler } from 'react';

const customGradientBarReducer = (
	state: CustomGradientBarReducerState,
	action: CustomGradientBarReducerAction
): CustomGradientBarReducerState => {
	switch ( action.type ) {
		case 'MOVE_INSERTER':
			if ( state.id === 'IDLE' || state.id === 'MOVING_INSERTER' ) {
				return {
					id: 'MOVING_INSERTER',
					insertPosition: action.insertPosition,
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
					insertPosition: state.insertPosition,
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
};
const customGradientBarReducerInitialState: CustomGradientBarIdleState = {
	id: 'IDLE',
};

export default function CustomGradientBar( {
	background,
	hasGradient,
	value: controlPoints,
	onChange,
	disableInserter = false,
	disableAlpha = false,
	__experimentalIsRenderedInSidebar = false,
}: CustomGradientBarProps ) {
	const gradientMarkersContainerDomRef = useRef< HTMLDivElement >( null );

	const [ gradientBarState, gradientBarStateDispatch ] = useReducer(
		customGradientBarReducer,
		customGradientBarReducerInitialState
	);
	const onMouseEnterAndMove: MouseEventHandler< HTMLDivElement > = (
		event
	) => {
		if ( ! gradientMarkersContainerDomRef.current ) {
			return;
		}

		const insertPosition = getHorizontalRelativeGradientPosition(
			event.clientX,
			gradientMarkersContainerDomRef.current
		);

		// If the insert point is close to an existing control point don't show it.
		if (
			controlPoints.some( ( { position } ) => {
				return (
					Math.abs( insertPosition - position ) <
					MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_POINT
				);
			} )
		) {
			if ( gradientBarState.id === 'MOVING_INSERTER' ) {
				gradientBarStateDispatch( { type: 'STOP_INSERTER_MOVE' } );
			}
			return;
		}

		gradientBarStateDispatch( { type: 'MOVE_INSERTER', insertPosition } );
	};

	const onMouseLeave = () => {
		gradientBarStateDispatch( { type: 'STOP_INSERTER_MOVE' } );
	};

	const isMovingInserter = gradientBarState.id === 'MOVING_INSERTER';
	const isInsertingControlPoint =
		gradientBarState.id === 'INSERTING_CONTROL_POINT';

	return (
		<div
			className={ clsx(
				'components-custom-gradient-picker__gradient-bar',
				{ 'has-gradient': hasGradient }
			) }
			onMouseEnter={ onMouseEnterAndMove }
			onMouseMove={ onMouseEnterAndMove }
			onMouseLeave={ onMouseLeave }
		>
			<div
				className="components-custom-gradient-picker__gradient-bar-background"
				style={ {
					background,
					opacity: hasGradient ? 1 : 0.4,
				} }
			/>
			<div
				ref={ gradientMarkersContainerDomRef }
				className="components-custom-gradient-picker__markers-container"
			>
				{ ! disableInserter &&
					( isMovingInserter || isInsertingControlPoint ) && (
						<ControlPoints.InsertPoint
							__experimentalIsRenderedInSidebar={
								__experimentalIsRenderedInSidebar
							}
							disableAlpha={ disableAlpha }
							insertPosition={ gradientBarState.insertPosition }
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
					__experimentalIsRenderedInSidebar={
						__experimentalIsRenderedInSidebar
					}
					disableAlpha={ disableAlpha }
					disableRemove={ disableInserter }
					gradientPickerDomRef={ gradientMarkersContainerDomRef }
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
