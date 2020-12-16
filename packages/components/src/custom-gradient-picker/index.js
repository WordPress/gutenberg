/**
 * External dependencies
 */
import { get, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AnglePickerControl from '../angle-picker-control';
import CustomGradientBar from './custom-gradient-bar';
import { Flex } from '../flex';
import SelectControl from '../select-control';
import {
	getGradientParsed,
	getGradientWithColorAtIndexChanged,
	getGradientWithColorAtPositionChanged,
	getGradientWithColorStopAdded,
	getGradientWithControlPointRemoved,
	getGradientWithPositionAtIndexChanged,
	getGradientWithPositionAtIndexDecreased,
	getGradientWithPositionAtIndexIncreased,
	getLinearGradientRepresentationOfARadial,
	getMarkerPoints,
	isControlPointOverlapping,
} from './utils';
import { serializeGradient } from './serializer';
import {
	DEFAULT_LINEAR_GRADIENT_ANGLE,
	HORIZONTAL_GRADIENT_ORIENTATION,
	GRADIENT_OPTIONS,
} from './constants';
import {
	AccessoryWrapper,
	SelectWrapper,
} from './styles/custom-gradient-picker-styles';

const GradientAnglePicker = ( { gradientAST, hasGradient, onChange } ) => {
	const angle = get(
		gradientAST,
		[ 'orientation', 'value' ],
		DEFAULT_LINEAR_GRADIENT_ANGLE
	);
	const onAngleChange = ( newAngle ) => {
		onChange(
			serializeGradient( {
				...gradientAST,
				orientation: {
					type: 'angular',
					value: newAngle,
				},
			} )
		);
	};
	return (
		<AnglePickerControl
			hideLabelFromVision
			onChange={ onAngleChange }
			value={ hasGradient ? angle : '' }
		/>
	);
};

const GradientTypePicker = ( { gradientAST, hasGradient, onChange } ) => {
	const { type } = gradientAST;
	const onSetLinearGradient = () => {
		onChange(
			serializeGradient( {
				...gradientAST,
				...( gradientAST.orientation
					? {}
					: { orientation: HORIZONTAL_GRADIENT_ORIENTATION } ),
				type: 'linear-gradient',
			} )
		);
	};

	const onSetRadialGradient = () => {
		onChange(
			serializeGradient( {
				...omit( gradientAST, [ 'orientation' ] ),
				type: 'radial-gradient',
			} )
		);
	};

	const handleOnChange = ( next ) => {
		if ( next === 'linear-gradient' ) {
			onSetLinearGradient();
		}
		if ( next === 'radial-gradient' ) {
			onSetRadialGradient();
		}
	};

	return (
		<SelectControl
			className="components-custom-gradient-picker__type-picker"
			label={ __( 'Type' ) }
			labelPosition={ 'side' }
			onChange={ handleOnChange }
			options={ GRADIENT_OPTIONS }
			value={ hasGradient && type }
		/>
	);
};

function reducer( state, action ) {
	const gradientAST = state;
	switch ( action.type ) {
		case 'ADD_BY_POSITION':
			return getGradientWithColorStopAdded(
				gradientAST,
				action.insertPosition,
				action.rgb
			);

		case 'REMOVE_BY_INDEX':
			return getGradientWithControlPointRemoved(
				gradientAST,
				action.index
			);

		case 'UPDATE_COLOR_BY_POSITION':
			return getGradientWithColorAtPositionChanged(
				gradientAST,
				action.insertPosition,
				action.rgb
			);

		case 'UPDATE_COLOR_BY_INDEX':
			return getGradientWithColorAtIndexChanged(
				gradientAST,
				action.index,
				action.rgb
			);

		case 'INCREASE_POSITION_BY_INDEX':
			return getGradientWithPositionAtIndexIncreased(
				gradientAST,
				action.gradientIndex
			);

		case 'DECREASE_POSITION_BY_INDEX':
			return getGradientWithPositionAtIndexDecreased(
				gradientAST,
				action.gradientIndex
			);

		case 'UPDATE_POSITION_BY_MOUSE':
			return ! isControlPointOverlapping(
				gradientAST,
				action.relativePosition,
				action.position
			)
				? getGradientWithPositionAtIndexChanged(
						gradientAST,
						action.position,
						action.relativePosition
				  )
				: gradientAST;
	}
}

export default function CustomGradientPicker( { value, onChange } ) {
	const parsedGradient = getGradientParsed( value );
	const { gradientAST, gradientValue, hasGradient } = parsedGradient;
	const { type } = gradientAST;
	const markerPoints = getMarkerPoints( gradientAST );
	// On radial gradients the bar should display a linear gradient.
	// On radial gradients the bar represents a slice of the gradient from the center until the outside.
	const background =
		gradientAST.type === 'radial-gradient'
			? getLinearGradientRepresentationOfARadial( gradientAST )
			: gradientValue;
	return (
		<div className="components-custom-gradient-picker">
			<CustomGradientBar
				value={ {
					hasGradient,
					markerPoints,
					background,
				} }
				onChange={ ( nextAction ) => {
					const nextAST = reducer( gradientAST, nextAction );
					onChange( serializeGradient( nextAST ) );
				} }
			/>
			<Flex
				gap={ 3 }
				className="components-custom-gradient-picker__ui-line"
			>
				<SelectWrapper>
					<GradientTypePicker
						gradientAST={ gradientAST }
						hasGradient={ hasGradient }
						onChange={ onChange }
					/>
				</SelectWrapper>
				<AccessoryWrapper>
					{ type === 'linear-gradient' && (
						<GradientAnglePicker
							gradientAST={ gradientAST }
							hasGradient={ hasGradient }
							onChange={ onChange }
						/>
					) }
				</AccessoryWrapper>
			</Flex>
		</div>
	);
}
