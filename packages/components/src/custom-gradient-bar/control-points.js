/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import ColorPicker from '../color-picker';
import Dropdown from '../dropdown';
import KeyboardShortcuts from '../keyboard-shortcuts';
import VisuallyHidden from '../visually-hidden';

import {
	addControlPoint,
	clampPercent,
	removeControlPoint,
	updateControlPointColor,
	updateControlPointColorByPosition,
	updateControlPointPosition,
	getHorizontalRelativeGradientPosition,
} from './utils';
import {
	COLOR_POPOVER_PROPS,
	GRADIENT_MARKERS_WIDTH,
	MINIMUM_SIGNIFICANT_MOVE,
	KEYBOARD_CONTROL_POINT_VARIATION,
} from './constants';

function ControlPointKeyboardMove( { value: position, onChange, children } ) {
	const shortcuts = {
		right( event ) {
			// Stop propagation of the key press event to avoid focus moving
			// to another editor area.
			event.stopPropagation();
			const newPosition = clampPercent(
				position + KEYBOARD_CONTROL_POINT_VARIATION
			);
			onChange( newPosition );
		},
		left( event ) {
			// Stop propagation of the key press event to avoid focus moving
			// to another editor area.
			event.stopPropagation();
			const newPosition = clampPercent(
				position - KEYBOARD_CONTROL_POINT_VARIATION
			);
			onChange( newPosition );
		},
	};

	return (
		<KeyboardShortcuts shortcuts={ shortcuts }>
			{ children }
		</KeyboardShortcuts>
	);
}

const ControlPointButton = forwardRef( function (
	{ isOpen, position, color, onChange, ...additionalProps },
	ref
) {
	const instanceId = useInstanceId( ControlPointButton );
	const descriptionId = `components-custom-gradient-picker__control-point-button-description-${ instanceId }`;
	return (
		<ControlPointKeyboardMove value={ position } onChange={ onChange }>
			<Button
				ref={ ref }
				aria-label={ sprintf(
					// translators: %1$s: gradient position e.g: 70, %2$s: gradient color code e.g: rgb(52,121,151).
					__(
						'Gradient control point at position %1$s%% with color code %2$s.'
					),
					position,
					color
				) }
				aria-describedby={ descriptionId }
				aria-haspopup="true"
				aria-expanded={ isOpen }
				className={ classnames(
					'components-custom-gradient-picker__control-point-button',
					{
						'is-active': isOpen,
					}
				) }
				style={ {
					left: `${ position }%`,
				} }
				{ ...additionalProps }
			/>
			<VisuallyHidden id={ descriptionId }>
				{ __(
					'Use your left or right arrow keys or drag and drop with the mouse to change the gradient position. Press the button to change the color or remove the control point.'
				) }
			</VisuallyHidden>
		</ControlPointKeyboardMove>
	);
} );

function useMouseDragListener(
	startMoveHandler,
	updateMoveHandler,
	stopMoveHandler,
	element
) {
	const savedStartHandlerRef = useRef();
	const savedUpdateHandlerRef = useRef();
	const savedStopHandlerRef = useRef();
	const isDraggingRef = useRef( false );

	useEffect( () => {
		savedStartHandlerRef.current = startMoveHandler;
	}, [ startMoveHandler ] );

	useEffect( () => {
		savedUpdateHandlerRef.current = updateMoveHandler;
	}, [ updateMoveHandler ] );

	useEffect( () => {
		savedStopHandlerRef.current = stopMoveHandler;
	}, [ stopMoveHandler ] );

	useEffect( () => {
		if (
			! (
				element?.addEventListener &&
				document?.documentElement?.addEventListener
			)
		) {
			// TODO: Unsure if document check is needed.
			return;
		}

		function onMouseMove( event ) {
			if ( savedUpdateHandlerRef?.current ) {
				savedUpdateHandlerRef.current( event );
			}
		}

		function onMouseUp( event ) {
			if ( ! isDraggingRef.current ) {
				return;
			}

			if ( savedStopHandlerRef?.current ) {
				savedStopHandlerRef.current( event );
			}

			document.documentElement.removeEventListener(
				'mousemove',
				onMouseMove
			);
			document.documentElement.removeEventListener(
				'mouseup',
				onMouseUp
			);
		}

		function onMouseDown( event ) {
			isDraggingRef.current = true;

			if ( savedStartHandlerRef?.current ) {
				savedStartHandlerRef.current( event );
			}

			document.documentElement.addEventListener( 'mouseup', onMouseUp );
			document.documentElement.addEventListener(
				'mousemove',
				onMouseMove
			);
		}

		element.addEventListener( 'mousedown', onMouseDown );

		return () => {
			if ( isDraggingRef.current ) {
				document.documentElement.removeEventListener(
					'mousemove',
					onMouseMove
				);
				document.documentElement.removeEventListener(
					'mouseup',
					onMouseUp
				);
			}

			element.removeEventListener( 'mousedown', onMouseDown );
		};
	}, [ element ] );
}

function ControlPointDropdown( {
	pointIndex,
	point,
	controlPoints,
	gradientPickerDomRef,
	onStartControlPointChange,
	onStopControlPointChange,
	onChange,
} ) {
	const initialPosition = point?.position;

	const controlPointMoveState = useRef();
	const controlPointRef = useRef();

	useMouseDragListener(
		function onMouseDown() {
			onStartControlPointChange();
			controlPointMoveState.current = {
				initialPosition,
				index: pointIndex,
				significantMoveHappened: false,
			};
		},
		function onMouseMove( event ) {
			const relativePosition = getHorizontalRelativeGradientPosition(
				event.clientX,
				gradientPickerDomRef.current,
				GRADIENT_MARKERS_WIDTH
			);

			if (
				! controlPointMoveState.current.significantMoveHappened &&
				Math.abs(
					controlPointMoveState.current.initialPosition -
						relativePosition
				) >= MINIMUM_SIGNIFICANT_MOVE
			) {
				controlPointMoveState.current.significantMoveHappened = true;
			}

			onChange(
				updateControlPointPosition(
					controlPoints,
					controlPointMoveState.current.index,
					relativePosition
				)
			);
		},
		function onMouseUp() {
			onStopControlPointChange();
		},
		controlPointRef.current
	);

	return (
		<Dropdown
			onClose={ onStopControlPointChange }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<ControlPointButton
					ref={ controlPointRef }
					onClick={ () => {
						if (
							controlPointMoveState.current
								.significantMoveHappened
						) {
							return;
						}
						if ( isOpen ) {
							onStopControlPointChange();
						} else {
							onStartControlPointChange();
						}
						onToggle();
					} }
					isOpen={ isOpen }
					position={ point.position }
					color={ point.color }
					onChange={ ( newPosition ) => {
						onChange(
							updateControlPointPosition(
								controlPoints,
								pointIndex,
								newPosition
							)
						);
					} }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					<ColorPicker
						color={ point.color }
						onChangeComplete={ ( { color } ) => {
							onChange(
								updateControlPointColor(
									controlPoints,
									pointIndex,
									color.toRgbString()
								)
							);
						} }
					/>
					<Button
						className="components-custom-gradient-picker__remove-control-point"
						onClick={ () => {
							onChange(
								removeControlPoint( controlPoints, pointIndex )
							);
							onClose();
						} }
						isLink
					>
						{ __( 'Remove Control Point' ) }
					</Button>
				</>
			) }
			popoverProps={ COLOR_POPOVER_PROPS }
		/>
	);
}

function ControlPoints( {
	gradientPickerDomRef,
	ignoreMarkerPosition,
	value: controlPoints,
	onChange,
	onStartControlPointChange,
	onStopControlPointChange,
} ) {
	return controlPoints.map( ( point, index ) => {
		return (
			ignoreMarkerPosition !== point?.position && (
				<ControlPointDropdown
					key={ index }
					point={ point }
					pointIndex={ index }
					controlPoints={ controlPoints }
					gradientPickerDomRef={ gradientPickerDomRef }
					onStartControlPointChange={ onStartControlPointChange }
					onStopControlPointChange={ onStopControlPointChange }
					onChange={ onChange }
				/>
			)
		);
	} );
}

function InsertPoint( {
	value: controlPoints,
	onChange,
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
					aria-haspopup="true"
					onClick={ () => {
						if ( isOpen ) {
							onCloseInserter();
						} else {
							setAlreadyInsertedPoint( false );
							onOpenInserter();
						}
						onToggle();
					} }
					className="components-custom-gradient-picker__insert-point"
					icon={ plus }
					style={ {
						left:
							insertPosition !== null
								? `${ insertPosition }%`
								: undefined,
					} }
				/>
			) }
			renderContent={ () => (
				<ColorPicker
					onChangeComplete={ ( { color } ) => {
						if ( ! alreadyInsertedPoint ) {
							onChange(
								addControlPoint(
									controlPoints,
									insertPosition,
									color.toRgbString()
								)
							);
							setAlreadyInsertedPoint( true );
						} else {
							onChange(
								updateControlPointColorByPosition(
									controlPoints,
									insertPosition,
									color.toRgbString()
								)
							);
						}
					} }
				/>
			) }
			popoverProps={ COLOR_POPOVER_PROPS }
		/>
	);
}
ControlPoints.InsertPoint = InsertPoint;

export default ControlPoints;
