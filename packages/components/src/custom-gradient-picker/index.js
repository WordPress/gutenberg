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
import CustomGradientBar from '../custom-gradient-bar';
import { Flex } from '../flex';
import SelectControl from '../select-control';
import {
	getGradientAstWithDefault,
	getLinearGradientRepresentation,
	getGradientAstWithControlPoints,
	getStopCssColor,
} from './utils';
import { serializeGradient } from './serializer';
import {
	DEFAULT_LINEAR_GRADIENT_ANGLE,
	HORIZONTAL_GRADIENT_ORIENTATION,
	GRADIENT_OPTIONS,
	DEFAULT_GRADIENT,
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
			onChange={ onAngleChange }
			labelPosition="top"
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
			labelPosition="top"
			onChange={ handleOnChange }
			options={ GRADIENT_OPTIONS }
			size="__unstable-large"
			value={ hasGradient && type }
		/>
	);
};

export default function CustomGradientPicker( {
	value,
	onChange,
	__experimentalIsRenderedInSidebar,
} ) {
	const gradientAST = getGradientAstWithDefault( value );
	// On radial gradients the bar should display a linear gradient.
	// On radial gradients the bar represents a slice of the gradient from the center until the outside.
	// On liner gradients the bar represents the color stops from left to right independently of the angle.
	const background = getLinearGradientRepresentation( gradientAST );
	const hasGradient = gradientAST.value !== DEFAULT_GRADIENT;
	// Control points color option may be hex from presets, custom colors will be rgb.
	// The position should always be a percentage.
	const controlPoints = gradientAST.colorStops.map( ( colorStop ) => ( {
		color: getStopCssColor( colorStop ),
		position: parseInt( colorStop.length.value ),
	} ) );

	return (
		<div className="components-custom-gradient-picker">
			<CustomGradientBar
				__experimentalIsRenderedInSidebar={
					__experimentalIsRenderedInSidebar
				}
				background={ background }
				hasGradient={ hasGradient }
				value={ controlPoints }
				onChange={ ( newControlPoints ) => {
					onChange(
						serializeGradient(
							getGradientAstWithControlPoints(
								gradientAST,
								newControlPoints
							)
						)
					);
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
					{ gradientAST.type === 'linear-gradient' && (
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
