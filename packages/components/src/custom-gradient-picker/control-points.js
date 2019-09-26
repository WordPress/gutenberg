
/**
 * External dependencies
 */
import { map } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, useCallback, useRef, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Button from '../button';
import ColorPicker from '../color-picker';
import Dropdown from '../dropdown';
import { serializeGradientColor, serializeGradientPosition } from './serializer';
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

export function useMarkerPoints( parsedGradient, maximumAbsolutePositionValue ) {
	return useMemo(
		() => {
			if ( ! parsedGradient ) {
				return [];
			}
			return map( parsedGradient.colorStops, ( colorStop ) => {
				if ( ! colorStop || ! colorStop.length || colorStop.length.type !== '%' ) {
					return null;
				}
				return {
					color: serializeGradientColor( colorStop ),
					position: serializeGradientPosition( colorStop.length ),
					positionValue: parseInt( colorStop.length.value ),
				};
			} );
		},
		[ parsedGradient, maximumAbsolutePositionValue ]
	);
}

class ControlPointKeyboardMove extends Component {
	constructor() {
		super( ...arguments );
		this.increase = this.increase.bind( this );
		this.decrease = this.decrease.bind( this );
		this.shortcuts = {
			right: () => this.increase(),
			left: () => this.decrease(),
		};
	}
	increase() {
		const { gradientIndex, onChange, parsedGradient } = this.props;
		onChange( getGradientWithPositionAtIndexIncreased( parsedGradient, gradientIndex ) );
	}

	decrease() {
		const { gradientIndex, onChange, parsedGradient } = this.props;
		onChange( getGradientWithPositionAtIndexDecreased( parsedGradient, gradientIndex ) );
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

const ControlPointButton = withInstanceId(
	function( {
		instanceId,
		isOpen,
		position,
		color,
		onChange,
		gradientIndex,
		parsedGradient,
		...additionalProps
	} ) {
		const descriptionId = `components-custom-gradient-picker__control-point-button-description-${ instanceId }`;
		return (
			<ControlPointKeyboardMove
				onChange={ onChange }
				gradientIndex={ gradientIndex }
				parsedGradient={ parsedGradient }
			>
				<Button
					aria-label={
						sprintf(
							// translators: %1$s: gradient position e.g: 70%, %2$s: gradient color code e.g: rgb( 52,121,151).
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
						'Use your left or right arrow keys or drag&drop with the mouse to change the gradient position. Press the button to change the color or remove the control point.'
					) }
				</div>
			</ControlPointKeyboardMove>
		);
	}
);

export function ControlPoints( {
	gradientPickerDomRef,
	ignoreMarkerPosition,
	markerPoints,
	onChange,
	parsedGradient,
	setIsInsertPointMoveEnabled,
} ) {
	const controlPointMoveState = useRef();
	const controlPointMove = useCallback(
		( event ) => {
			const relativePosition = getHorizontalRelativeGradientPosition(
				event.clientX,
				gradientPickerDomRef.current,
				GRADIENT_MARKERS_WIDTH,
			);
			const { parsedGradient: referenceParsedGradient, position, significantMoveHappened } = controlPointMoveState.current;
			if ( ! significantMoveHappened ) {
				const initialPosition = referenceParsedGradient.colorStops[ position ].length.value;
				if ( Math.abs( initialPosition - relativePosition ) >= MINIMUM_SIGNIFICANT_MOVE ) {
					controlPointMoveState.current.significantMoveHappened = true;
				}
			}

			if ( ! isControlPointOverlapping( parsedGradient, relativePosition, position ) ) {
				onChange(
					getGradientWithPositionAtIndexChanged( referenceParsedGradient, position, relativePosition )
				);
			}
		},
		[ controlPointMoveState, onChange, gradientPickerDomRef ]
	);

	const onMouseUp = useCallback(
		() => {
			if ( window && window.removeEventListener ) {
				window.removeEventListener( 'mousemove', controlPointMove );
				window.removeEventListener( 'mouseup', onMouseUp );
			}
		},
		[ controlPointMove ]
	);

	const controlPointMouseDown = useMemo(
		() => {
			return parsedGradient.colorStops.map(
				( colorStop, index ) => () => {
					if ( window && window.addEventListener ) {
						controlPointMoveState.current = {
							parsedGradient,
							position: index,
							significantMoveHappened: false,
						};
						window.addEventListener( 'mousemove', controlPointMove );
						window.addEventListener( 'mouseup', onMouseUp );
					}
				}
			);
		},
		[ parsedGradient, controlPointMove, onMouseUp, controlPointMoveState ]
	);

	const enableInsertPointMove = useCallback(
		() => {
			setIsInsertPointMoveEnabled( true );
		},
		[ setIsInsertPointMoveEnabled ]
	);

	const keyboardShortcuts = useMemo(
		() => {
			return parsedGradient.colorStops.map(
				( colorStop, index ) => {
					return {
						left: () => onChange( getGradientWithPositionAtIndexDecreased( parsedGradient, index ) ),
						right: () => onChange( getGradientWithPositionAtIndexIncreased( parsedGradient, index ) ),
					};
				}
			);
		},
		[ parsedGradient, onChange ]
	);

	return markerPoints.map(
		( point, index ) => (
			point && ignoreMarkerPosition !== point.positionValue && (
				<Dropdown
					key={ index }
					onClose={ enableInsertPointMove }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<ControlPointButton
							keyboardShortcuts={ keyboardShortcuts[ index ] }
							onClick={ () => {
								if ( controlPointMoveState.current.significantMoveHappened ) {
									return;
								}
								onToggle();
								setIsInsertPointMoveEnabled( false );
							} }
							onMouseDown={ controlPointMouseDown[ index ] }
							isOpen={ isOpen }
							position={ point.position }
							color={ point.color }
							onChange={ onChange }
							parsedGradient={ parsedGradient }
							gradientIndex={ index }
						/>
					) }
					renderContent={ ( { onClose } ) => (
						<>
							<ColorPicker
								color={ point.color }
								onChangeComplete={ ( { rgb } ) => {
									onChange(
										getGradientWithColorAtIndexChanged( parsedGradient, index, rgb )
									);
								} }
							/>
							<Button
								className="components-custom-gradient-picker__remove-control-point"
								onClick={ () => {
									onChange(
										getGradientWithControlPointRemoved( parsedGradient, index )
									);
									setIsInsertPointMoveEnabled( true );
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
