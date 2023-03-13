/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AnglePickerControl from '../angle-picker-control';
import CustomGradientBar from './gradient-bar';
import { Flex } from '../flex';
import SelectControl from '../select-control';
import { VStack } from '../v-stack';
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
	const angle =
		gradientAST?.orientation?.value ?? DEFAULT_LINEAR_GRADIENT_ANGLE;
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
			__nextHasNoMarginBottom
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
		const { orientation, ...restGradientAST } = gradientAST;
		onChange(
			serializeGradient( {
				...restGradientAST,
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
			__nextHasNoMarginBottom
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
	/** Start opting into the new margin-free styles that will become the default in a future version. */
	__nextHasNoMargin = false,
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

	if ( ! __nextHasNoMargin ) {
		deprecated(
			'Outer margin styles for wp.components.CustomGradientPicker',
			{
				since: '6.1',
				version: '6.4',
				hint: 'Set the `__nextHasNoMargin` prop to true to start opting into the new styles, which will become the default in a future version',
			}
		);
	}

	return (
		<VStack
			spacing={ 4 }
			className={ classnames( 'components-custom-gradient-picker', {
				'is-next-has-no-margin': __nextHasNoMargin,
			} ) }
		>
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
		</VStack>
	);
}
