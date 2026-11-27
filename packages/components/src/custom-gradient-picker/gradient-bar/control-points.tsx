import clsx from 'clsx';
import { colord } from 'colord';
import { useInstanceId } from '@wordpress/compose';
import {
	forwardRef,
	useEffect,
	useRef,
	useState,
	useMemo,
} from '@wordpress/element';
import type { ForwardedRef } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import Button from '../../button';
import { HStack } from '../../h-stack';
import { ColorPicker } from '../../color-picker';
import { VisuallyHidden } from '../../visually-hidden';
import { CustomColorPickerDropdown } from '../../color-palette';
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
	MINIMUM_SIGNIFICANT_MOVE,
	KEYBOARD_CONTROL_POINT_VARIATION,
} from './constants';
import type { WordPressComponentProps } from '../../context';
import type {
	ControlPoint,
	ControlPointButtonProps,
	ControlPointMoveState,
	ControlPointsProps,
	InsertPointProps,
} from '../types';
import type { CustomColorPickerDropdownProps } from '../../color-palette/types';
import DropdownContentWrapper from '../../dropdown/dropdown-content-wrapper';

function UnforwardedControlPointButton(
	{
		isOpen,
		position,
		color,
		disablePositioning,
		...additionalProps
	}: WordPressComponentProps< ControlPointButtonProps, 'button', true >,
	ref: ForwardedRef< HTMLButtonElement >
) {
	const instanceId = useInstanceId( UnforwardedControlPointButton );
	const descriptionId = `components-custom-gradient-picker__control-point-button-description-${ instanceId }`;
	return (
		<>
			<Button
				ref={ ref }
				aria-label={ sprintf(
					// translators: 1: gradient position e.g: 70. 2: gradient color code e.g: rgb(52,121,151).
					__(
						'Gradient control point at position %1$d%% with color code %2$s.'
					),
					position,
					color
				) }
				aria-describedby={ descriptionId }
				aria-haspopup="true"
				aria-expanded={ isOpen }
				__next40pxDefaultSize
				className={ clsx(
					'components-custom-gradient-picker__control-point-button',
					{
						'is-active': isOpen,
					}
				) }
				{ ...additionalProps }
			/>
			<VisuallyHidden id={ descriptionId }>
				{ disablePositioning
					? __( 'Press the button to change the color.' )
					: __(
							'Use your left or right arrow keys or drag and drop with the mouse to change the gradient position. Press the button to change the color or remove the control point.'
						) }
			</VisuallyHidden>
		</>
	);
}

const ControlPointButton = forwardRef( UnforwardedControlPointButton );

function GradientColorPickerDropdown( {
	isRenderedInSidebar,
	className,
	...props
}: CustomColorPickerDropdownProps ) {
	// Open the popover below the gradient control/insertion point
	const popoverProps = useMemo(
		() =>
			( {
				placement: 'bottom',
				offset: 8,
				// Disabling resize as it would otherwise cause the popover to show
				// scrollbars while dragging the color picker's handle close to the
				// popover edge.
				resize: false,
			} ) as const,
		[]
	);

	const mergedClassName = clsx(
		'components-custom-gradient-picker__control-point-dropdown',
		className
	);

	return (
		<CustomColorPickerDropdown
			isRenderedInSidebar={ isRenderedInSidebar }
			popoverProps={ popoverProps }
			className={ mergedClassName }
			{ ...props }
		/>
	);
}

function ControlPoints( {
	disableRemove,
	disableAlpha,
	disablePositioning,
	gradientPickerDomRef,
	ignoreMarkerPosition,
	value: controlPoints,
	onChange,
	onStartControlPointChange,
	onStopControlPointChange,
	__experimentalIsRenderedInSidebar,
}: ControlPointsProps ) {
	const controlPointMoveStateRef =
		useRef< ControlPointMoveState >( undefined );

	const onMouseMove = ( event: MouseEvent ) => {
		if (
			controlPointMoveStateRef.current === undefined ||
			gradientPickerDomRef.current === null
		) {
			return;
		}

		const relativePosition = getHorizontalRelativeGradientPosition(
			event.clientX,
			gradientPickerDomRef.current
		);

		const { initialPosition, index, significantMoveHappened } =
			controlPointMoveStateRef.current;

		if (
			! significantMoveHappened &&
			Math.abs( initialPosition - relativePosition ) >=
				MINIMUM_SIGNIFICANT_MOVE
		) {
			controlPointMoveStateRef.current.significantMoveHappened = true;
		}

		onChange(
			updateControlPointPosition( controlPoints, index, relativePosition )
		);
	};

	const cleanEventListeners = () => {
		if (
			window &&
			window.removeEventListener &&
			controlPointMoveStateRef.current &&
			controlPointMoveStateRef.current.listenersActivated
		) {
			window.removeEventListener( 'mousemove', onMouseMove );
			window.removeEventListener( 'mouseup', cleanEventListeners );
			onStopControlPointChange();
			controlPointMoveStateRef.current.listenersActivated = false;
		}
	};

	// Keep the cleanup for the registered listeners across rerenders during a drag.
	const cleanEventListenersRef = useRef< () => void >( undefined );

	useEffect( () => {
		return () => {
			cleanEventListenersRef.current?.();
		};
	}, [] );

	const buttonsRef = useRef< ( HTMLButtonElement | null )[] >( [] );
	const keyboardMovedPointRef = useRef< ControlPoint >( undefined );

	const moveControlPointWithKeyboard = (
		index: number,
		position: number
	) => {
		const newControlPoints = updateControlPointPosition(
			controlPoints,
			index,
			position
		);
		keyboardMovedPointRef.current = newControlPoints[ index ];
		onChange( newControlPoints );
	};

	// Sorting the new value can give the moved point another index. Its
	// focused button keeps the old index, so move focus to the moved point.
	useEffect( () => {
		const movedPoint = keyboardMovedPointRef.current;
		keyboardMovedPointRef.current = undefined;
		if ( ! movedPoint ) {
			return;
		}
		const buttons = buttonsRef.current;
		const focusedIndex = buttons.findIndex(
			( button ) =>
				!! button && button === button.ownerDocument.activeElement
		);
		const isMovedPoint = ( point?: ControlPoint ) =>
			point?.position === movedPoint.position &&
			colord( point.color ).toRgbString() ===
				colord( movedPoint.color ).toRgbString();
		if (
			focusedIndex === -1 ||
			isMovedPoint( controlPoints[ focusedIndex ] )
		) {
			return;
		}
		buttons[ controlPoints.findIndex( isMovedPoint ) ]?.focus();
	}, [ controlPoints ] );

	return (
		<>
			{ controlPoints.map( ( point, index ) => {
				const initialPosition = point?.position;
				return (
					ignoreMarkerPosition !== initialPosition && (
						<GradientColorPickerDropdown
							isRenderedInSidebar={
								__experimentalIsRenderedInSidebar
							}
							key={ index }
							onClose={ onStopControlPointChange }
							renderToggle={ ( { isOpen, onToggle } ) => (
								<ControlPointButton
									key={ index }
									ref={ ( button ) => {
										buttonsRef.current[ index ] = button;
									} }
									onClick={ () => {
										if (
											controlPointMoveStateRef.current &&
											controlPointMoveStateRef.current
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
									onMouseDown={ () => {
										if ( disablePositioning ) {
											return;
										}
										if (
											window &&
											window.addEventListener
										) {
											cleanEventListenersRef.current?.();
											controlPointMoveStateRef.current = {
												initialPosition,
												index,
												significantMoveHappened: false,
												listenersActivated: true,
											};
											cleanEventListenersRef.current =
												cleanEventListeners;
											window.addEventListener(
												'mousemove',
												onMouseMove
											);
											window.addEventListener(
												'mouseup',
												cleanEventListeners
											);
											onStartControlPointChange();
										}
									} }
									onKeyDown={ ( event ) => {
										if ( disablePositioning ) {
											// The point cannot move, but the
											// arrow keys are still consumed so
											// they do not bubble away and move
											// focus to another editor area.
											if (
												event.code === 'ArrowLeft' ||
												event.code === 'ArrowRight'
											) {
												event.stopPropagation();
											}
											return;
										}
										if ( event.code === 'ArrowLeft' ) {
											// Stop propagation of the key press event to avoid focus moving
											// to another editor area.
											event.stopPropagation();
											moveControlPointWithKeyboard(
												index,
												clampPercent(
													point.position -
														KEYBOARD_CONTROL_POINT_VARIATION
												)
											);
										} else if (
											event.code === 'ArrowRight'
										) {
											// Stop propagation of the key press event to avoid focus moving
											// to another editor area.
											event.stopPropagation();
											moveControlPointWithKeyboard(
												index,
												clampPercent(
													point.position +
														KEYBOARD_CONTROL_POINT_VARIATION
												)
											);
										}
									} }
									isOpen={ isOpen }
									position={ point.position }
									color={ point.color }
									disablePositioning={ disablePositioning }
								/>
							) }
							renderContent={ ( { onClose } ) => (
								<DropdownContentWrapper paddingSize="none">
									<ColorPicker
										enableAlpha={ ! disableAlpha }
										color={ point.color }
										onChange={ ( color ) => {
											onChange(
												updateControlPointColor(
													controlPoints,
													index,
													colord(
														color
													).toRgbString()
												)
											);
										} }
									/>
									{ ! disableRemove &&
										controlPoints.length > 2 && (
											<HStack
												className="components-custom-gradient-picker__remove-control-point-wrapper"
												alignment="center"
											>
												<Button
													onClick={ () => {
														onChange(
															removeControlPoint(
																controlPoints,
																index
															)
														);
														onClose();
													} }
													variant="link"
												>
													{ __(
														'Remove Control Point'
													) }
												</Button>
											</HStack>
										) }
								</DropdownContentWrapper>
							) }
							style={ {
								left: `${ point.position }%`,
								transform: 'translateX( -50% )',
							} }
						/>
					)
				);
			} ) }
		</>
	);
}

function InsertPoint( {
	value: controlPoints,
	onChange,
	onOpenInserter,
	onCloseInserter,
	insertPosition,
	disableAlpha,
	__experimentalIsRenderedInSidebar,
}: InsertPointProps ) {
	const [ alreadyInsertedPoint, setAlreadyInsertedPoint ] = useState( false );
	return (
		<GradientColorPickerDropdown
			isRenderedInSidebar={ __experimentalIsRenderedInSidebar }
			className="components-custom-gradient-picker__inserter"
			onClose={ () => {
				onCloseInserter();
			} }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					__next40pxDefaultSize
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
					className="components-custom-gradient-picker__insert-point-dropdown"
					icon={ plus }
				/>
			) }
			renderContent={ () => (
				<DropdownContentWrapper paddingSize="none">
					<ColorPicker
						enableAlpha={ ! disableAlpha }
						onChange={ ( color ) => {
							if ( ! alreadyInsertedPoint ) {
								onChange(
									addControlPoint(
										controlPoints,
										insertPosition,
										colord( color ).toRgbString()
									)
								);
								setAlreadyInsertedPoint( true );
							} else {
								onChange(
									updateControlPointColorByPosition(
										controlPoints,
										insertPosition,
										colord( color ).toRgbString()
									)
								);
							}
						} }
					/>
				</DropdownContentWrapper>
			) }
			style={
				insertPosition !== null
					? {
							left: `${ insertPosition }%`,
							transform: 'translateX( -50% )',
						}
					: undefined
			}
		/>
	);
}
ControlPoints.InsertPoint = InsertPoint;

export default ControlPoints;
