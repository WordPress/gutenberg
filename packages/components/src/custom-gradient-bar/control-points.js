/**
 * External dependencies
 */
import classnames from 'classnames';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useRef, useState, useMemo } from '@wordpress/element';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Button from '../button';
import { ColorPicker } from '../color-picker';
import { VisuallyHidden } from '../visually-hidden';
import { CustomColorPickerDropdown } from '../color-palette';

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
	GRADIENT_MARKERS_WIDTH,
	MINIMUM_SIGNIFICANT_MOVE,
	KEYBOARD_CONTROL_POINT_VARIATION,
} from './constants';

function ControlPointButton( { isOpen, position, color, ...additionalProps } ) {
	const instanceId = useInstanceId( ControlPointButton );
	const descriptionId = `components-custom-gradient-picker__control-point-button-description-${ instanceId }`;
	return (
		<>
			<Button
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
		</>
	);
}

function GradientColorPickerDropdown( {
	isRenderedInSidebar,
	gradientPickerDomRef,
	...props
} ) {
	const popoverProps = useMemo( () => {
		const result = {
			className:
				'components-custom-gradient-picker__color-picker-popover',
			position: 'top',
		};
		if ( isRenderedInSidebar ) {
			result.anchorRef = gradientPickerDomRef.current;
			result.position = isRTL() ? 'bottom right' : 'bottom left';
		}
		return result;
	}, [ gradientPickerDomRef.current, isRenderedInSidebar ] );
	return (
		<CustomColorPickerDropdown
			isRenderedInSidebar={ isRenderedInSidebar }
			popoverProps={ popoverProps }
			{ ...props }
		/>
	);
}

function ControlPoints( {
	disableRemove,
	disableAlpha,
	gradientPickerDomRef,
	ignoreMarkerPosition,
	value: controlPoints,
	onChange,
	onStartControlPointChange,
	onStopControlPointChange,
	__experimentalIsRenderedInSidebar,
} ) {
	const controlPointMoveState = useRef();

	const onMouseMove = ( event ) => {
		const relativePosition = getHorizontalRelativeGradientPosition(
			event.clientX,
			gradientPickerDomRef.current,
			GRADIENT_MARKERS_WIDTH
		);
		const {
			initialPosition,
			index,
			significantMoveHappened,
		} = controlPointMoveState.current;
		if (
			! significantMoveHappened &&
			Math.abs( initialPosition - relativePosition ) >=
				MINIMUM_SIGNIFICANT_MOVE
		) {
			controlPointMoveState.current.significantMoveHappened = true;
		}

		onChange(
			updateControlPointPosition( controlPoints, index, relativePosition )
		);
	};

	const cleanEventListeners = () => {
		if (
			window &&
			window.removeEventListener &&
			controlPointMoveState.current &&
			controlPointMoveState.current.listenersActivated
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

	return controlPoints.map( ( point, index ) => {
		const initialPosition = point?.position;
		return (
			ignoreMarkerPosition !== initialPosition && (
				<GradientColorPickerDropdown
					gradientPickerDomRef={ gradientPickerDomRef }
					isRenderedInSidebar={ __experimentalIsRenderedInSidebar }
					key={ index }
					onClose={ onStopControlPointChange }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<ControlPointButton
							key={ index }
							onClick={ () => {
								if (
									controlPointMoveState.current &&
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
							onMouseDown={ () => {
								if ( window && window.addEventListener ) {
									controlPointMoveState.current = {
										initialPosition,
										index,
										significantMoveHappened: false,
										listenersActivated: true,
									};
									onStartControlPointChange();
									window.addEventListener(
										'mousemove',
										onMouseMove
									);
									window.addEventListener(
										'mouseup',
										cleanEventListeners
									);
								}
							} }
							onKeyDown={ ( event ) => {
								if ( event.keyCode === LEFT ) {
									// Stop propagation of the key press event to avoid focus moving
									// to another editor area.
									event.stopPropagation();
									onChange(
										updateControlPointPosition(
											controlPoints,
											index,
											clampPercent(
												point.position -
													KEYBOARD_CONTROL_POINT_VARIATION
											)
										)
									);
								} else if ( event.keyCode === RIGHT ) {
									// Stop propagation of the key press event to avoid focus moving
									// to another editor area.
									event.stopPropagation();
									onChange(
										updateControlPointPosition(
											controlPoints,
											index,
											clampPercent(
												point.position +
													KEYBOARD_CONTROL_POINT_VARIATION
											)
										)
									);
								}
							} }
							isOpen={ isOpen }
							position={ point.position }
							color={ point.color }
						/>
					) }
					renderContent={ ( { onClose } ) => (
						<>
							<ColorPicker
								enableAlpha={ ! disableAlpha }
								color={ point.color }
								onChange={ ( color ) => {
									onChange(
										updateControlPointColor(
											controlPoints,
											index,
											colord( color ).toRgbString()
										)
									);
								} }
							/>
							{ ! disableRemove && controlPoints.length > 2 && (
								<Button
									className="components-custom-gradient-picker__remove-control-point"
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
									{ __( 'Remove Control Point' ) }
								</Button>
							) }
						</>
					) }
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
	disableAlpha,
	__experimentalIsRenderedInSidebar,
	gradientPickerDomRef,
} ) {
	const [ alreadyInsertedPoint, setAlreadyInsertedPoint ] = useState( false );
	return (
		<GradientColorPickerDropdown
			gradientPickerDomRef={ gradientPickerDomRef }
			isRenderedInSidebar={ __experimentalIsRenderedInSidebar }
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
			) }
		/>
	);
}
ControlPoints.InsertPoint = InsertPoint;

export default ControlPoints;
