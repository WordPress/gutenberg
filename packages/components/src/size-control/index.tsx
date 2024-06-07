/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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

function SizeControl( props: SizeControlProps ) {
	const {
		__next40pxDefaultSize,
		value,
		isDisabled,
		size = 'default',
		units: unitsProp = DEFAULT_UNITS,
		withSlider = false,
		withReset = true,
		onChange,
		hasUnits,
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

	return (
		<Flex className="components-font-size-picker__custom-size-control">
			<FlexItem isBlock>
				<UnitControl
					__next40pxDefaultSize={ __next40pxDefaultSize }
					label={ __( 'Custom' ) }
					labelPosition="top"
					hideLabelFromVision
					value={ value }
					onChange={ ( newValue ) => {
						if ( newValue === undefined ) {
							onChange?.( undefined );
						} else {
							onChange?.(
								hasUnits ? newValue : parseInt( newValue, 10 )
							);
						}
					} }
					size={ size }
					units={ hasUnits ? units : [] }
					min={ 0 }
				/>
			</FlexItem>
			{ withSlider && (
				<FlexItem isBlock>
					<Spacer marginX={ 2 } marginBottom={ 0 }>
						<RangeControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize={ __next40pxDefaultSize }
							className="components-font-size-picker__custom-input"
							label={ __( 'Custom Size' ) }
							hideLabelFromVision
							value={ valueQuantity }
							initialPosition={ fallbackValue }
							withInputField={ false }
							onChange={ ( newValue ) => {
								if ( newValue === undefined ) {
									onChange?.( undefined );
								} else if ( hasUnits ) {
									onChange?.(
										newValue + ( valueUnit ?? 'px' )
									);
								} else {
									onChange?.( newValue );
								}
							} }
							min={ 0 }
							max={ isValueUnitRelative ? 10 : 100 }
							step={ isValueUnitRelative ? 0.1 : 1 }
						/>
					</Spacer>
				</FlexItem>
			) }
			{ withReset && (
				<FlexItem>
					<Button
						disabled={ isDisabled }
						__experimentalIsFocusable
						onClick={ () => {
							onChange?.( undefined );
						} }
						variant="secondary"
						__next40pxDefaultSize
						size={
							size === '__unstable-large' ||
							props.__next40pxDefaultSize
								? 'default'
								: 'small'
						}
					>
						{ __( 'Reset' ) }
					</Button>
				</FlexItem>
			) }
		</Flex>
	);
}

export default SizeControl;
