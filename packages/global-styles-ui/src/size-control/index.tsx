/**
 * WordPress dependencies
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

interface SizeControlProps {
	value?: string;
	onChange?: ( value: string | undefined ) => void;
	fallbackValue?: number;
	disabled?: boolean;
	label?: string;
}

function SizeControl( props: SizeControlProps ) {
	const { baseControlProps } = useBaseControlProps( props );
	const { value, onChange, fallbackValue, disabled, label } = props;

	const units = useCustomUnits( {
		availableUnits: DEFAULT_UNITS,
	} );

	const [ valueQuantity, valueUnit = 'px' ] =
		parseQuantityAndUnitFromRawValue( value, units );

	const isValueUnitRelative =
		!! valueUnit && [ 'em', 'rem', 'vw', 'vh' ].includes( valueUnit );

	// Receives the new value from the UnitControl component as a string containing the value and unit.
	const handleUnitControlChange = ( newValue: string | undefined ) => {
		onChange?.( newValue );
	};

	// Receives the new value from the RangeControl component as a number.
	const handleRangeControlChange = ( newValue: number | undefined ) => {
		if ( newValue !== undefined ) {
			onChange?.( newValue + valueUnit );
		} else {
			onChange?.( undefined );
		}
	};

	return (
		<BaseControl { ...baseControlProps }>
			<Flex>
				<FlexItem isBlock>
					<UnitControl
						__next40pxDefaultSize
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
							label={ label }
							hideLabelFromVision
							value={ valueQuantity }
							initialPosition={ fallbackValue }
							withInputField={ false }
							onChange={ handleRangeControlChange }
							min={ 0 }
							max={ isValueUnitRelative ? 10 : 100 }
							step={ isValueUnitRelative ? 0.1 : 1 }
							disabled={ disabled }
						/>
					</Spacer>
				</FlexItem>
			</Flex>
		</BaseControl>
	);
}

export { SizeControl };
