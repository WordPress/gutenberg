/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { BaseControl, useBaseControlProps } from '../base-control';
import type { WordPressComponentProps } from '../context/wordpress-component';
import { Button } from '../button';
import RangeControl from '../range-control';
import { Flex, FlexItem } from '../flex';
import type { SizeControlProps } from './types';
import {
	default as UnitControl,
	parseQuantityAndUnitFromRawValue,
	useCustomUnits,
} from '../unit-control';

import { Spacer } from '../spacer';

export const DEFAULT_UNITS = [ 'px', 'em', 'rem', 'vw', 'vh' ];

function UnforwardedSizeControl(
	props: WordPressComponentProps< SizeControlProps, 'input', true >,
	ref: ForwardedRef< HTMLInputElement >
) {
	const { baseControlProps } = useBaseControlProps( props );

	const instanceId = useInstanceId( UnforwardedSizeControl );
	const id = `size-control-${ instanceId }`;

	const {
		__next40pxDefaultSize = true,
		__nextHasNoMarginBottom = true,
		hasUnit = true,
		value,
		disabled,
		size = 'default',
		units: unitsProp = DEFAULT_UNITS,
		withSlider = true,
		withReset = true,
		onChange,
		fallbackValue,
	} = props;

	const units = useCustomUnits( {
		availableUnits: unitsProp,
	} );

	const [ valueQuantity, valueUnit ] = parseQuantityAndUnitFromRawValue(
		value,
		units
	);
	const isValueUnitRelative =
		!! valueUnit && [ 'em', 'rem', 'vw', 'vh' ].includes( valueUnit );

	const handleValueChange = ( newValue: string | number | undefined ) => {
		// On Reset
		if ( newValue === undefined ) {
			onChange?.( undefined );
			return;
		}

		// If the component is initalized as a unitless value (for retrocompatibility)
		if ( ! hasUnit ) {
			onChange?.( parseInt( String( newValue ), 10 ) );
			return;
		}

		// Parse the new value and unit.
		const [ newQuantity, newUnit ] = parseQuantityAndUnitFromRawValue(
			newValue,
			units
		);
		onChange?.(
			// If the new value is empty or couldn't be parsed, pass the raw value received.
			newQuantity ? newQuantity + ( newUnit ?? 'px' ) : newValue
		);
	};

	return (
		<BaseControl { ...baseControlProps } id={ id }>
			<Flex className="components-size-control__custom-size-control">
				<FlexItem isBlock>
					<UnitControl
						id={ id }
						__next40pxDefaultSize={ __next40pxDefaultSize }
						disabled={ disabled }
						label={ __( 'Custom' ) }
						labelPosition="top"
						hideLabelFromVision
						value={ value }
						onChange={ handleValueChange }
						size={ size }
						units={ units }
						min={ 0 }
					/>
				</FlexItem>
				{ withSlider && (
					<FlexItem isBlock>
						<Spacer marginX={ 2 } marginBottom={ 0 }>
							<RangeControl
								disabled={ disabled }
								__next40pxDefaultSize={ __next40pxDefaultSize }
								__nextHasNoMarginBottom={
									__nextHasNoMarginBottom
								}
								className="components-size-control__custom-input"
								label={ __( 'Custom Size' ) }
								hideLabelFromVision
								value={ valueQuantity }
								initialPosition={ fallbackValue }
								withInputField={ false }
								onChange={ handleValueChange }
								min={ 0 }
								max={ isValueUnitRelative ? 10 : 100 }
								step={ isValueUnitRelative ? 0.1 : 1 }
								ref={ ref }
							/>
						</Spacer>
					</FlexItem>
				) }
				{ withReset && (
					<FlexItem>
						<Button
							disabled={ ! value || disabled }
							__experimentalIsFocusable
							__next40pxDefaultSize={ __next40pxDefaultSize }
							onClick={ () => {
								onChange?.( undefined );
							} }
							variant="secondary"
							size={
								size === '__unstable-large' ||
								__next40pxDefaultSize
									? 'default'
									: 'small'
							}
						>
							{ __( 'Reset' ) }
						</Button>
					</FlexItem>
				) }
			</Flex>
		</BaseControl>
	);
}

export const SizeControl = forwardRef( UnforwardedSizeControl );

export default SizeControl;
