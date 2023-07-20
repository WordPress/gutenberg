/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BaseControl,
	Flex,
	FlexItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
	__experimentalSpacer as Spacer,
	RangeControl,
	Button,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { settings } from '@wordpress/icons';

export default function WidthControl( {
	label = __( 'Width' ),
	value,
	widths = [],
	enableCustomWidth = false,
	onChange,
} ) {
	const isKnownValue = value === undefined || widths.includes( value );
	const [ isCustom, setIsCustom ] = useState(
		enableCustomWidth && ! isKnownValue
	);
	return (
		<fieldset className="block-editor-width-control">
			<BaseControl.VisualLabel as="legend">
				{ label }
			</BaseControl.VisualLabel>
			<Flex>
				{ ! isCustom && (
					<FlexItem isBlock>
						<ToggleGroupControl
							label={ label }
							hideLabelFromVision
							isBlock
							size="__unstable-large"
							__nextHasNoMarginBottom
							value={ value }
							onChange={ onChange }
						>
							{ widths.map( ( width ) => (
								<ToggleGroupControlOption
									key={ width }
									value={ width }
									label={ width }
								/>
							) ) }
						</ToggleGroupControl>
					</FlexItem>
				) }
				{ isCustom && (
					<>
						<FlexItem isBlock>
							<UnitControl
								size={ '__unstable-large' }
								min={ 0 }
								value={ value }
								// units={ units }
								onChange={ onChange }
								// onUnitChange={ handleUnitChange }
							/>
						</FlexItem>
						<FlexItem isBlock>
							<Spacer marginX={ 2 } marginBottom={ 0 }>
								<RangeControl
									withInputField={ false }
									__nextHasNoMarginBottom
									min={ 0 }
									// max={
									// RANGE_CONTROL_CUSTOM_SETTINGS[
									// selectedUnit
									// ]?.max ?? 100
									// }
									// step={
									// RANGE_CONTROL_CUSTOM_SETTINGS[
									// selectedUnit
									// ]?.step ?? 0.1
									// }
									// value={ customRangeValue }
									// onChange={ handleSliderChange }
								/>
							</Spacer>
						</FlexItem>
					</>
				) }
				{ enableCustomWidth && (
					<FlexItem>
						<Button
							label={
								isCustom
									? __( 'Use width preset' )
									: __( 'Set custom width' )
							}
							icon={ settings }
							isSmall
							isPressed={ isCustom }
							onClick={ () => setIsCustom( ! isCustom ) }
						/>
					</FlexItem>
				) }
			</Flex>
		</fieldset>
	);
}
