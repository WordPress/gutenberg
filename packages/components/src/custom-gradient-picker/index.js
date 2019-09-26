
/**
 * External dependencies
 */
import gradientParser from 'gradient-parser';
import { some } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useState, useRef, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';
import ColorPicker from '../color-picker';
import Dropdown from '../dropdown';
import { useMarkerPoints, ControlPoints } from './control-points';
import {
	DEFAULT_GRADIENT,
	INSERT_POINT_WIDTH,
	COLOR_POPOVER_PROPS,
	MINIMUM_DISTANCE_BETWEEN_POINTS,
} from './constants';
import { serializeGradient } from './serializer';
import { getHorizontalRelativeGradientPosition, getGradientWithColorStopAdded, getGradientWithColorAtPositionChanged } from './utils';

function InsertPoint( {
	onChange,
	parsedGradient,
	insertPointPosition,
	setIsInsertPointMoveEnabled,
	isInsertingColorAtPosition,
	setIsInsertingColorAtPosition,
	setInsertPointPosition,
} ) {
	const onColorPopoverClose = useCallback(
		() => {
			setIsInsertPointMoveEnabled( true );
			setIsInsertingColorAtPosition( null );
			setInsertPointPosition( null );
		},
		[ setIsInsertPointMoveEnabled, setIsInsertingColorAtPosition, setInsertPointPosition ]
	);
	const renderToggle = useCallback(
		( { isOpen, onToggle } ) => (
			<IconButton
				aria-expanded={ isOpen }
				onClick={ () => {
					setIsInsertPointMoveEnabled( false );
					onToggle();
				} }
				className="components-custom-gradient-picker__insert-point"
				icon="insert"
				style={ {
					left: insertPointPosition !== null ? `${ insertPointPosition }%` : undefined,
				} }
			/>
		),
		[ insertPointPosition, setIsInsertPointMoveEnabled ]
	);
	const onColorChange = useCallback(
		( { rgb } ) => {
			let newGradient;
			if ( isInsertingColorAtPosition === null ) {
				newGradient = getGradientWithColorStopAdded( parsedGradient, insertPointPosition, rgb );
				setIsInsertingColorAtPosition( insertPointPosition );
			} else {
				newGradient = getGradientWithColorAtPositionChanged( parsedGradient, isInsertingColorAtPosition, rgb );
			}
			onChange( newGradient );
		},
		[ insertPointPosition, isInsertingColorAtPosition, onChange, setIsInsertingColorAtPosition ]
	);
	const renderContent = useCallback(
		() => (
			<ColorPicker
				onChangeComplete={ onColorChange }
			/>
		),
		[ onColorChange ]
	);
	return (
		<Dropdown
			className="components-custom-gradient-picker__inserter"
			onClose={ onColorPopoverClose }
			renderToggle={ renderToggle }
			renderContent={ renderContent }
			popoverProps={ COLOR_POPOVER_PROPS }
		/>
	);
}

export default function CustomGradientPicker( { value, onChange } ) {
	let hasGradient = true;
	if ( ! value ) {
		hasGradient = false;
		value = DEFAULT_GRADIENT;
	}
	const parsedGradient = useMemo(
		() => {
			try {
				return gradientParser.parse( value )[ 0 ];
			} catch ( error ) {
				hasGradient = false;
				return gradientParser.parse( DEFAULT_GRADIENT )[ 0 ];
			}
		},
		[ value ]
	);
	const onGradientStructureChange = useCallback(
		( newGradientStructure ) => {
			onChange( serializeGradient( newGradientStructure ) );
		},
		[ onChange ]
	);
	const [ insertPointPosition, setInsertPointPosition ] = useState( null );
	const isInsertPointMoveEnabled = useRef( true );
	const setIsInsertPointMoveEnabled = useCallback(
		( isEnabled ) => {
			isInsertPointMoveEnabled.current = isEnabled;
		},
		[ isInsertPointMoveEnabled ]
	);
	const [ isInsertingColorAtPosition, setIsInsertingColorAtPosition ] = useState( null );
	const gradientPickerDomRef = useRef();
	const markerPoints = useMarkerPoints( parsedGradient, gradientPickerDomRef );
	const updateInsertPointPosition = useCallback(
		( event ) => {
			if ( ! gradientPickerDomRef.current || ! isInsertPointMoveEnabled.current ) {
				return;
			}
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
				setInsertPointPosition( null );
				return;
			}

			setInsertPointPosition( insertPosition );
		},
		[ markerPoints, gradientPickerDomRef, setInsertPointPosition ]
	);

	const onMouseLeave = useCallback(
		() => {
			if ( ! isInsertPointMoveEnabled.current ) {
				return;
			}
			setInsertPointPosition( null );
		},
		[ isInsertPointMoveEnabled, setInsertPointPosition ]
	);

	return (
		<div
			ref={ gradientPickerDomRef }
			className={ classnames(
				'components-custom-gradient-picker',
				{ 'has-gradient': hasGradient }
			) }
			onMouseEnter={ updateInsertPointPosition }
			onMouseMove={ updateInsertPointPosition }
			style={ {
				background: value,
			} }
			onMouseLeave={ onMouseLeave }
		>
			<div className="components-custom-gradient-picker__markers-container">
				{ insertPointPosition !== null && (
					<InsertPoint
						setIsInsertPointMoveEnabled={ setIsInsertPointMoveEnabled }
						insertPointPosition={ insertPointPosition }
						isInsertingColorAtPosition={ isInsertingColorAtPosition }
						setIsInsertingColorAtPosition={ setIsInsertingColorAtPosition }
						onChange={ onGradientStructureChange }
						parsedGradient={ parsedGradient }
						setInsertPointPosition={ setInsertPointPosition }
					/>
				) }
				<ControlPoints
					gradientPickerDomRef={ gradientPickerDomRef }
					ignoreMarkerPosition={ isInsertingColorAtPosition }
					markerPoints={ markerPoints }
					onChange={ onGradientStructureChange }
					parsedGradient={ parsedGradient }
					setIsInsertPointMoveEnabled={ setIsInsertPointMoveEnabled }
				/>
			</div>
		</div>
	);
}
