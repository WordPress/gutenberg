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

function UnforwardedBaseSizeControl(
	props: WordPressComponentProps< SizeControlProps, 'input', true >,
	ref: ForwardedRef< HTMLInputElement >
) {
	const { baseControlProps } = useBaseControlProps( props );

	const instanceId = useInstanceId( UnforwardedBaseSizeControl );
	const id = `size-control-${ instanceId }`;

	const {
		__next40pxDefaultSize = true,
		__nextHasNoMarginBottom = true,
		value,
		disabled,
		size = 'default',
		units: unitsProp = DEFAULT_UNITS,
		withSlider = false,
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

	const handleRangeChange = ( newValue: number | undefined ) => {
		if ( newValue === undefined ) {
			onChange?.( undefined );
			return;
		}
		onChange?.( newValue + ( valueUnit ?? 'px' ) );
	};

	const handleUnitChange = ( newValue: string | undefined ) => {
		if ( newValue === undefined ) {
			onChange?.( undefined );
		} else {
			onChange?.( valueUnit ? newValue : parseInt( newValue, 10 ) );
		}
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
						onChange={ handleUnitChange }
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
								onChange={ handleRangeChange }
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
							disabled={ disabled }
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

const SizeControl = forwardRef( UnforwardedBaseSizeControl );

export default SizeControl;
