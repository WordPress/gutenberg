
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Button from '../button';
import ColorPicker from '../color-picker';
import Dropdown from '../dropdown';
import {
	getGradientWithColorAtIndexChanged,
	getGradientWithControlPointRemoved,
	getGradientWithPositionAtIndexChanged,
	getGradientWithPositionAtIndexDecreased,
	getGradientWithPositionAtIndexIncreased,
	getHorizontalRelativeGradientPosition,
	isControlPointOverlapping,
} from './utils';
import {
	COLOR_POPOVER_PROPS,
	GRADIENT_MARKERS_WIDTH,
	MINIMUM_SIGNIFICANT_MOVE,
} from './constants';
import KeyboardShortcuts from '../keyboard-shortcuts';

class ControlPointKeyboardMove extends Component {
	constructor() {
		super( ...arguments );
		this.increase = this.increase.bind( this );
		this.decrease = this.decrease.bind( this );
		this.shortcuts = {
			right: this.increase,
			left: this.decrease,
		};
	}
	increase( event ) {
		// Stop propagation of the key press event to avoid focus moving
		// to another editor area.
		event.stopPropagation();
		const { gradientIndex, onChange, gradientAST } = this.props;
		onChange( getGradientWithPositionAtIndexIncreased( gradientAST, gradientIndex ) );
	}

	decrease( event ) {
		// Stop propagation of the key press event to avoid focus moving
		// to another editor area.
		event.stopPropagation();
		const { gradientIndex, onChange, gradientAST } = this.props;
		onChange( getGradientWithPositionAtIndexDecreased( gradientAST, gradientIndex ) );
	}
	render() {
		const { children } = this.props;
		return (
			<KeyboardShortcuts shortcuts={ this.shortcuts }>
				{ children }
			</KeyboardShortcuts>
		);
	}
}

function ControlPointButton( {
	isOpen,
	position,
	color,
	onChange,
	gradientIndex,
	gradientAST,
	...additionalProps
} ) {
	const instanceId = useInstanceId( ControlPointButton );
	const descriptionId = `components-custom-gradient-picker__control-point-button-description-${ instanceId }`;
	return (
		<ControlPointKeyboardMove
			onChange={ onChange }
			gradientIndex={ gradientIndex }
			gradientAST={ gradientAST }
		>
			<Button
				aria-label={
					sprintf(
						// translators: %1$s: gradient position e.g: 70%, %2$s: gradient color code e.g: rgb(52,121,151).
						__( 'Gradient control point at position %1$s with color code %2$s.' ),
						position,
						color
					)
				}
				aria-describedby={ descriptionId }
				aria-expanded={ isOpen }
				className={
					classnames(
						'components-custom-gradient-picker__control-point-button',
						{ 'is-active': isOpen }
					)
				}
				style={ {
					left: position,
				} }
				{ ...additionalProps }
			/>
			<div
				className="screen-reader-text"
				id={ descriptionId }>
				{ __(
					'Use your left or right arrow keys or drag and drop with the mouse to change the gradient position. Press the button to change the color or remove the control point.'
				) }
			</div>
		</ControlPointKeyboardMove>
	);
}

export default function ControlPoints( {
	gradientPickerDomRef,
	ignoreMarkerPosition,
	markerPoints,
	onChange,
	gradientAST,
	onStartControlPointChange,
	onStopControlPointChange,
} ) {
	const controlPointMoveState = useRef();

	const onMouseMove = ( event ) => {
		const relativePosition = getHorizontalRelativeGradientPosition(
			event.clientX,
			gradientPickerDomRef.current,
			GRADIENT_MARKERS_WIDTH,
		);
		const {
			gradientAST: referenceGradientAST,
			position,
			significantMoveHappened,
		} = controlPointMoveState.current;
		if ( ! significantMoveHappened ) {
			const initialPosition = referenceGradientAST.colorStops[ position ].length.value;
			if ( Math.abs( initialPosition - relativePosition ) >= MINIMUM_SIGNIFICANT_MOVE ) {
				controlPointMoveState.current.significantMoveHappened = true;
			}
		}

		if ( ! isControlPointOverlapping( referenceGradientAST, relativePosition, position ) ) {
			onChange(
				getGradientWithPositionAtIndexChanged( referenceGradientAST, position, relativePosition )
			);
		}
	};

	const cleanEventListeners = () => {
		if (
			window && window.removeEventListener &&
			controlPointMoveState.current && controlPointMoveState.current.listenersActivated
		) {
			window.removeEventListener( 'mousemove', onMouseMove );
			window.removeEventListener( 'mouseup', cleanEventListeners );
			onStopControlPointChange();
			controlPointMoveState.current.listenersActivated = false;
		}
	};

	useEffect( () => {
		return () => {
			cleanEventListeners();
		};
	}, [] );

	return markerPoints.map(
		( point, index ) => (
			point && ignoreMarkerPosition !== point.positionValue && (
				<Dropdown
					key={ index }
					onClose={ onStopControlPointChange }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<ControlPointButton
							key={ index }
							onClick={ () => {
								if (
									controlPointMoveState.current &&
									controlPointMoveState.current.significantMoveHappened
								) {
									return;
								}
								onStartControlPointChange();
								onToggle();
							} }
							onMouseDown={ () => {
								if ( window && window.addEventListener ) {
									controlPointMoveState.current = {
										gradientAST,
										position: index,
										significantMoveHappened: false,
										listenersActivated: true,
									};
									onStartControlPointChange();
									window.addEventListener( 'mousemove', onMouseMove );
									window.addEventListener( 'mouseup', cleanEventListeners );
								}
							} }
							isOpen={ isOpen }
							position={ point.position }
							color={ point.color }
							onChange={ onChange }
							gradientAST={ gradientAST }
							gradientIndex={ index }
						/>
					) }
					renderContent={ ( { onClose } ) => (
						<>
							<ColorPicker
								color={ point.color }
								onChangeComplete={ ( { rgb } ) => {
									onChange(
										getGradientWithColorAtIndexChanged( gradientAST, index, rgb )
									);
								} }
							/>
							<Button
								className="components-custom-gradient-picker__remove-control-point"
								onClick={ () => {
									onChange(
										getGradientWithControlPointRemoved( gradientAST, index )
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
			)
		)
	);
}
