/**
 * WordPress dependencies
 */
import {
	RangeControl,
	Tooltip,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';

/**
 * CustomValueControls component for handling custom value input.
 *
 * Renders a UnitControl and RangeControl for custom value input mode.
 * Handles conditional tooltip wrapping and drag event coordination.
 *
 * @param {Object}   props
 * @param {boolean}  props.allowNegativeOnDrag       Whether to allow negative values during drag operations.
 * @param {string}   props.ariaLabel                 Accessible label for the controls.
 * @param {string}   props.allPlaceholder            Placeholder text (e.g., "Mixed").
 * @param {number}   props.minValue                  Minimum allowed value.
 * @param {number}   props.parsedQuantity            The numeric part of the current value.
 * @param {string}   props.computedUnit              The unit part of the current value.
 * @param {Array}    props.units                     Array of available unit objects.
 * @param {boolean}  props.isMixed                   Whether the current value is mixed.
 * @param {number}   props.step                      Step value for the range control.
 * @param {number}   props.max                       Maximum value for the range control.
 * @param {boolean}  props.showTooltip               Whether to wrap UnitControl in a tooltip.
 * @param {string}   props.value                     Current value for drag event checks.
 * @param {number}   props.minimumCustomValue        Minimum custom value for drag end reset.
 * @param {Function} props.onCustomValueChange       Callback when UnitControl value changes.
 * @param {Function} props.onCustomValueSliderChange Callback when RangeControl value changes.
 * @param {Function} props.onUnitChange              Callback when unit changes.
 * @param {Function} props.onMouseOut                Mouse out event handler.
 * @param {Function} props.onMouseOver               Mouse over event handler.
 * @param {Function} props.setMinValue               Function to set minimum value state.
 *
 * @return {Element} The CustomValueControls component.
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
} ) {
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
			size="__unstable-large"
			units={ units }
			value={ [ parsedQuantity, computedUnit ].join( '' ) }
			placeholder={ allPlaceholder }
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
		<Tooltip text={ ariaLabel } placement="top">
			<div className="preset-input-control__tooltip-wrapper">
				{ unitControl }
			</div>
		</Tooltip>
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
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>
		</>
	);
}
