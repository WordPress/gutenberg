import {
	RangeControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { Tooltip } from '@wordpress/ui';
import type { CustomValueControlsProps } from './types';

/**
 * CustomValueControls component for handling custom value input.
 *
 * Renders a UnitControl and RangeControl for custom value input mode.
 * Handles conditional tooltip wrapping and drag event coordination.
 *
 * @param props
 * @param props.allowNegativeOnDrag       Whether to allow negative values during drag operations.
 * @param props.ariaLabel                 Accessible label for the controls.
 * @param props.allPlaceholder            Placeholder text (e.g., "Mixed").
 * @param props.minValue                  Minimum allowed value.
 * @param props.parsedQuantity            The numeric part of the current value.
 * @param props.computedUnit              The unit part of the current value.
 * @param props.units                     Array of available unit objects.
 * @param props.isMixed                   Whether the current value is mixed.
 * @param props.step                      Step value for the range control.
 * @param props.max                       Maximum value for the range control.
 * @param props.showTooltip               Whether to wrap UnitControl in a tooltip.
 * @param props.value                     Current value for drag event checks.
 * @param props.minimumCustomValue        Minimum custom value for drag end reset.
 * @param props.onCustomValueChange       Callback when UnitControl value changes.
 * @param props.onCustomValueSliderChange Callback when RangeControl value changes.
 * @param props.onUnitChange              Callback when unit changes.
 * @param props.onMouseOut                Mouse out event handler.
 * @param props.onMouseOver               Mouse over event handler.
 * @param props.setMinValue               Function to set minimum value state.
 *
 * @return The CustomValueControls component.
 */
export default function CustomValueControls( {
	allowNegativeOnDrag,
	ariaLabel,
	allPlaceholder,
	minValue,
	parsedQuantity,
	computedUnit,
	units,
	isMixed,
	step,
	max,
	showTooltip,
	value,
	minimumCustomValue,
	onCustomValueChange,
	onCustomValueSliderChange,
	onUnitChange,
	onMouseOut,
	onMouseOver,
	setMinValue,
}: CustomValueControlsProps ) {
	const unitControl = (
		<UnitControl
			className="preset-input-control__unit-control"
			disableUnits={ isMixed }
			hideLabelFromVision
			label={ ariaLabel }
			min={ minValue }
			onChange={ onCustomValueChange }
			onUnitChange={ onUnitChange }
			onBlur={ onMouseOut }
			onFocus={ onMouseOver }
			onMouseOut={ onMouseOut }
			onMouseOver={ onMouseOver }
			units={ units }
			value={ [ parsedQuantity, computedUnit ].join( '' ) }
			// A `null` placeholder renders none.
			placeholder={ allPlaceholder as string | undefined }
			onDragStart={ () => {
				if ( allowNegativeOnDrag && value?.charAt( 0 ) === '-' ) {
					setMinValue( 0 );
				}
			} }
			onDrag={ () => {
				if ( allowNegativeOnDrag && value?.charAt( 0 ) === '-' ) {
					setMinValue( 0 );
				}
			} }
			onDragEnd={ () => {
				if ( allowNegativeOnDrag ) {
					setMinValue( minimumCustomValue );
				}
			} }
		/>
	);

	const wrappedUnitControl = showTooltip ? (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<div className="preset-input-control__tooltip-wrapper">
						{ unitControl }
					</div>
				}
			/>
			<Tooltip.Popup>{ ariaLabel }</Tooltip.Popup>
		</Tooltip.Root>
	) : (
		unitControl
	);

	return (
		<>
			{ wrappedUnitControl }
			<RangeControl
				className="preset-input-control__custom-value-range"
				hideLabelFromVision
				initialPosition={ 0 }
				label={ ariaLabel }
				max={ max }
				min={ 0 }
				onBlur={ onMouseOut }
				onChange={ onCustomValueSliderChange }
				onFocus={ onMouseOver }
				onMouseOut={ onMouseOut }
				onMouseOver={ onMouseOver }
				step={ step }
				value={ parsedQuantity }
				withInputField={ false }
			/>
		</>
	);
}
