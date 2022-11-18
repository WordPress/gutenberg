/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import {
	BaseControl,
	RangeControl,
	Flex,
	FlexItem,
	__experimentalSpacer as Spacer,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSetting from '../use-setting';

const CUSTOM_VALUE_SETTINGS = {
	px: { max: 1000, steps: 1 },
	'%': { max: 100, steps: 1 },
	vw: { max: 100, steps: 1 },
	vh: { max: 100, steps: 1 },
	em: { max: 50, steps: 0.1 },
	rm: { max: 50, steps: 0.1 },
};

export default function HeightControl( {
	onChange,
	label = __( 'Height' ),
	value,
} ) {
	const customRangeValue = parseFloat( value );

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'%',
			'px',
			'em',
			'rem',
			'vh',
			'vw',
		],
	} );

	const selectedUnit =
		useMemo(
			() => parseQuantityAndUnitFromRawValue( value ),
			[ value ]
		)[ 1 ] || units[ 0 ].value;

	const handleSliderChange = ( next ) => {
		onChange( [ next, selectedUnit ].join( '' ) );
	};

	return (
		<fieldset className="component-height-control">
			<BaseControl.VisualLabel as="legend">
				{ label }
			</BaseControl.VisualLabel>
			<Flex>
				<FlexItem isBlock>
					<UnitControl
						value={ value }
						units={ units }
						onChange={ onChange }
						min={ 0 }
						size={ '__unstable-large' }
					/>
				</FlexItem>
				<FlexItem isBlock>
					<Spacer marginX={ 2 } marginBottom={ 0 }>
						<RangeControl
							value={ customRangeValue }
							min={ 0 }
							max={
								CUSTOM_VALUE_SETTINGS[ selectedUnit ]?.max ?? 10
							}
							step={
								CUSTOM_VALUE_SETTINGS[ selectedUnit ]?.steps ??
								0.1
							}
							withInputField={ false }
							onChange={ handleSliderChange }
						/>
					</Spacer>
				</FlexItem>
			</Flex>
		</fieldset>
	);
}
