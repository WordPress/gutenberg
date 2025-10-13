/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import {
	BaseControl,
	RangeControl,
	Flex,
	FlexItem,
	useBaseControlProps,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalUnitControl as UnitControl,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';

const DEFAULT_UNITS = [ 'px', 'em', 'rem', 'vw', 'vh' ];

function SizeControl( {
	// Do not allow manipulation of margin bottom
	__nextHasNoMarginBottom,
	...props
} ) {
	const { baseControlProps } = useBaseControlProps( props );
	const { value, onChange, fallbackValue, disabled, label, max } = props;

	const units = useCustomUnits( {
		availableUnits: DEFAULT_UNITS,
	} );

	const maxRelativeValue = 10;
	const maxNonRelativeValue = 100;

	// Helper function to check if a unit is relative
	const isUnitRelative = ( unit ) =>
		!! unit && [ 'em', 'rem', 'vw', 'vh' ].includes( unit );

	const [ valueQuantity, valueUnit = 'px' ] =
		parseQuantityAndUnitFromRawValue( value, units );

	const isValueUnitRelative = isUnitRelative( valueUnit );

	// Determine the max value for the range control
	const getMaxValue = () => {
		// For relative units, always use 10
		if ( isValueUnitRelative ) {
			return maxRelativeValue;
		}
		// For non-relative units, use custom max from props or default 500
		return max !== undefined ? max : maxNonRelativeValue;
	};

	// Receives the new value from the UnitControl component as a string containing the value and unit.
	const handleUnitControlChange = ( newValue ) => {
		const [ newQuantity, newUnit = 'px' ] =
			parseQuantityAndUnitFromRawValue( newValue, units );

		const isNewUnitRelative = isUnitRelative( newUnit );

		// If switching to a relative unit and the value exceeds the max, clamp it
		if ( isNewUnitRelative && newQuantity > maxRelativeValue ) {
			onChange( maxRelativeValue + newUnit );
		} else {
			onChange( newValue );
		}
	};

	// Receives the new value from the RangeControl component as a number.
	const handleRangeControlChange = ( newValue ) => {
		onChange?.( newValue + valueUnit );
	};

	return (
		<BaseControl { ...baseControlProps } __nextHasNoMarginBottom>
			<Flex>
				<FlexItem isBlock>
					<UnitControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ label }
						hideLabelFromVision
						value={ value }
						onChange={ handleUnitControlChange }
						units={ units }
						min={ 0 }
						disabled={ disabled }
					/>
				</FlexItem>
				<FlexItem isBlock>
					<Spacer marginX={ 2 } marginBottom={ 0 }>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ label }
							hideLabelFromVision
							value={ valueQuantity }
							initialPosition={ fallbackValue }
							withInputField={ false }
							onChange={ handleRangeControlChange }
							min={ 0 }
							max={ getMaxValue() }
							step={ isValueUnitRelative ? 0.1 : 1 }
							disabled={ disabled }
						/>
					</Spacer>
				</FlexItem>
			</Flex>
		</BaseControl>
	);
}

export default SizeControl;
