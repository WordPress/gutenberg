/**
 * External dependencies
 */
import { type LinearGradientNode } from 'gradient-parser';

/**
 * WordPress dependencies
 */
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
} from './constants';
import {
	AccessoryWrapper,
	SelectWrapper,
} from './styles/custom-gradient-picker-styles';
import type {
	CustomGradientPickerProps,
	GradientAnglePickerProps,
	GradientTypePickerProps,
} from './types';

const GradientAnglePicker = ( {
	gradientAST,
	hasGradient,
	onChange,
}: GradientAnglePickerProps ) => {
	const angle =
		gradientAST?.orientation?.value ?? DEFAULT_LINEAR_GRADIENT_ANGLE;
	const onAngleChange = ( newAngle: number ) => {
		onChange(
			serializeGradient( {
				...gradientAST,
				orientation: {
					type: 'angular',
					value: `${ newAngle }`,
				},
			} )
		);
	};
	return (
		<AnglePickerControl
			onChange={ onAngleChange }
			value={ hasGradient ? angle : '' }
		/>
	);
};

const GradientTypePicker = ( {
	gradientAST,
	hasGradient,
	onChange,
}: GradientTypePickerProps ) => {
	const { type } = gradientAST;

	const onSetLinearGradient = () => {
		onChange(
			serializeGradient( {
				...gradientAST,
				orientation: gradientAST.orientation
					? undefined
					: HORIZONTAL_GRADIENT_ORIENTATION,
				type: 'linear-gradient',
			} satisfies LinearGradientNode )
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

	const handleOnChange = ( next: string ) => {
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
			value={ hasGradient ? type : undefined }
		/>
	);
};

/**
 * CustomGradientPicker is a React component that renders a UI for specifying
 * linear or radial gradients. Radial gradients are displayed in the picker as
 * a slice of the gradient from the center to the outside.
 *
 * ```jsx
 * import { CustomGradientPicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyCustomGradientPicker = () => {
 *   const [ gradient, setGradient ] = useState();
 *
 *   return (
 *     <CustomGradientPicker
 *			value={ gradient }
 *			onChange={ setGradient }
 *     />
 *   );
 * };
 * ```
 */
export function CustomGradientPicker( {
	value,
	onChange,
	__experimentalIsRenderedInSidebar = false,
}: CustomGradientPickerProps ) {
	const { gradientAST, hasGradient } = getGradientAstWithDefault( value );

	// On radial gradients the bar should display a linear gradient.
	// On radial gradients the bar represents a slice of the gradient from the center until the outside.
	// On liner gradients the bar represents the color stops from left to right independently of the angle.
	const background = getLinearGradientRepresentation( gradientAST );

	// Control points color option may be hex from presets, custom colors will be rgb.
	// The position should always be a percentage.
	const controlPoints = gradientAST.colorStops.map( ( colorStop ) => {
		return {
			color: getStopCssColor( colorStop ),
			// Although it's already been checked by `hasUnsupportedLength` in `getGradientAstWithDefault`,
			// TypeScript doesn't know that `colorStop.length` is not undefined here.
			// @ts-expect-error
			position: parseInt( colorStop.length.value ),
		};
	} );

	return (
		<VStack spacing={ 4 } className="components-custom-gradient-picker">
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

export default CustomGradientPicker;
