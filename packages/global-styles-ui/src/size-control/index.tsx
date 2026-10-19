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

interface RangeSetting {
	max: number;
	step: number;
}

/**
 * Default slider max and step per unit. Dragging stops at a max;
 * typing does not.
 */
const DEFAULT_RANGE_SETTINGS: Record< string, RangeSetting > = {
	px: { max: 100, step: 1 },
	em: { max: 10, step: 0.1 },
	rem: { max: 10, step: 0.1 },
	vw: { max: 10, step: 0.1 },
	vh: { max: 10, step: 0.1 },
};

const FALLBACK_RANGE_SETTING: RangeSetting = { max: 100, step: 1 };

interface SizeControlProps {
	value?: string;
	onChange?: ( value: string | undefined ) => void;
	fallbackValue?: number;
	disabled?: boolean;
	label?: string;
	/**
	 * Override the slider max and step per unit, merged over the defaults.
	 * A max that works for `px` won't for `rem`, so set each unit separately.
	 */
	rangeSettings?: Record< string, Partial< RangeSetting > >;
}

function SizeControl( props: SizeControlProps ) {
	const { baseControlProps } = useBaseControlProps( props );
	const { value, onChange, fallbackValue, disabled, label, rangeSettings } =
		props;

	const units = useCustomUnits( {
		availableUnits: DEFAULT_UNITS,
	} );

	const [ valueQuantity, valueUnit = 'px' ] =
		parseQuantityAndUnitFromRawValue( value, units );

	const unitDefaults =
		DEFAULT_RANGE_SETTINGS[ valueUnit ] ?? FALLBACK_RANGE_SETTING;
	const unitOverrides = rangeSettings?.[ valueUnit ];
	const max = unitOverrides?.max ?? unitDefaults.max;
	const step = unitOverrides?.step ?? unitDefaults.step;

	// Receives the new value from the UnitControl component as a string containing the value and unit.
	const handleUnitControlChange = ( newValue: string | undefined ) => {
		onChange?.( newValue );
	};

	// Receives the new value from the RangeControl component as a number.
	const handleRangeControlChange = ( newValue: number | undefined ) => {
		if ( newValue !== undefined ) {
			onChange?.( `${ newValue }${ valueUnit }` );
		} else {
			onChange?.( undefined );
		}
	};

	return (
		<BaseControl { ...baseControlProps }>
			<Flex>
				<FlexItem isBlock>
					<UnitControl
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
							label={ label }
							hideLabelFromVision
							value={ valueQuantity }
							initialPosition={ fallbackValue }
							withInputField={ false }
							onChange={ handleRangeControlChange }
							min={ 0 }
							max={ max }
							step={ step }
							disabled={ disabled }
						/>
					</Spacer>
				</FlexItem>
			</Flex>
		</BaseControl>
	);
}

export { SizeControl };
