
/**
 * External dependencies
 */
import gradientParser from 'gradient-parser';
import { some } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useReducer, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import ColorPicker from '../color-picker';
import Dropdown from '../dropdown';
import ControlPoints from './control-points';
import {
	DEFAULT_GRADIENT,
	INSERT_POINT_WIDTH,
	COLOR_POPOVER_PROPS,
	MINIMUM_DISTANCE_BETWEEN_POINTS,
} from './constants';
import { serializeGradient } from './serializer';
import {
	getGradientWithColorAtPositionChanged,
	getGradientWithColorStopAdded,
	getHorizontalRelativeGradientPosition,
	getMarkerPoints,
} from './utils';

function InsertPoint( {
	onChange,
	gradientAST,
	onOpenInserter,
	onCloseInserter,
	insertPosition,
} ) {
	const [ alreadyInsertedPoint, setAlreadyInsertedPoint ] = useState( false );
	return (
		<Dropdown
			className="components-custom-gradient-picker__inserter"
			onClose={ () => {
				onCloseInserter();
			} }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					aria-expanded={ isOpen }
					onClick={ () => {
						setAlreadyInsertedPoint( false );
						onOpenInserter();
						onToggle();
					} }
					className="components-custom-gradient-picker__insert-point"
					icon="insert"
					style={ {
						left: insertPosition !== null ? `${ insertPosition }%` : undefined,
					} }
				/>
			) }
			renderContent={ () => (
				<ColorPicker
					onChangeComplete={ ( { rgb } ) => {
						let newGradient;
						if ( alreadyInsertedPoint ) {
							newGradient = getGradientWithColorAtPositionChanged( gradientAST, insertPosition, rgb );
						} else {
							newGradient = getGradientWithColorStopAdded( gradientAST, insertPosition, rgb );
							setAlreadyInsertedPoint( true );
						}
						onChange( newGradient );
					} }
				/>
			) }
			popoverProps={ COLOR_POPOVER_PROPS }
		/>
	);
}

function customGradientBarReducer( state, action ) {
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
}
const customGradientBarReducerInitialState = { id: 'IDLE' };

export default function CustomGradientPicker( { value, onChange } ) {
	let hasGradient = !! value;
	// gradientAST will contain the gradient AST as parsed by gradient-parser npm module.
	// More information of its structure available at.
	let gradientAST;
	let gradientValueUsed;
	try {
		gradientAST = gradientParser.parse( value || DEFAULT_GRADIENT )[ 0 ];
		gradientValueUsed = value || DEFAULT_GRADIENT;
	} catch ( error ) {
		hasGradient = false;
		gradientAST = gradientParser.parse( DEFAULT_GRADIENT )[ 0 ];
		gradientValueUsed = DEFAULT_GRADIENT;
	}

	const onGradientStructureChange = ( newGradientStructure ) => {
		onChange( serializeGradient( newGradientStructure ) );
	};

	const gradientPickerDomRef = useRef();
	const markerPoints = getMarkerPoints( gradientAST );

	const [ gradientBarState, gradientBarStateDispatch ] = useReducer(
		customGradientBarReducer,
		customGradientBarReducerInitialState
	);
	const onMouseEnterAndMove = ( event ) => {
		const insertPosition = getHorizontalRelativeGradientPosition(
			event.clientX,
			gradientPickerDomRef.current,
			INSERT_POINT_WIDTH,
		);

		// If the insert point is close to an existing control point don't show it.
		if ( some(
			markerPoints,
			( { positionValue } ) => {
				return Math.abs( insertPosition - positionValue ) < MINIMUM_DISTANCE_BETWEEN_POINTS;
			}
		) ) {
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
	const isInsertingControlPoint = gradientBarState.id === 'INSERTING_CONTROL_POINT';

	return (
		<div
			ref={ gradientPickerDomRef }
			className={ classnames(
				'components-custom-gradient-picker',
				{ 'has-gradient': hasGradient }
			) }
			onMouseEnter={ onMouseEnterAndMove }
			onMouseMove={ onMouseEnterAndMove }
			style={ {
				background: gradientValueUsed,
			} }
			onMouseLeave={ onMouseLeave }
		>
			<div className="components-custom-gradient-picker__markers-container">
				{ ( isMovingInserter || isInsertingControlPoint ) && (
					<InsertPoint
						insertPosition={ gradientBarState.insertPosition }
						onChange={ onGradientStructureChange }
						gradientAST={ gradientAST }
						onOpenInserter={ () => {
							gradientBarStateDispatch( { type: 'OPEN_INSERTER' } );
						} }
						onCloseInserter={ () => {
							gradientBarStateDispatch( { type: 'CLOSE_INSERTER' } );
						} }
					/>
				) }
				<ControlPoints
					gradientPickerDomRef={ gradientPickerDomRef }
					ignoreMarkerPosition={ isInsertingControlPoint ? gradientBarState.insertPosition : undefined }
					markerPoints={ markerPoints }
					onChange={ onGradientStructureChange }
					gradientAST={ gradientAST }
					onStartControlPointChange={ () => {
						gradientBarStateDispatch( { type: 'START_CONTROL_CHANGE' } );
					} }
					onStopControlPointChange={ () => {
						gradientBarStateDispatch( { type: 'STOP_CONTROL_CHANGE' } );
					} }
				/>
			</div>
		</div>
	);
}
