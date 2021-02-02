/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import RangeCell from '../mobile/bottom-sheet/range-cell';
import StepperCell from '../mobile/bottom-sheet/stepper-cell';

const RangeControl = memo(
	( {
		className,
		currentInput,
		label,
		value,
		instanceId,
		onChange,
		beforeIcon,
		afterIcon,
		help,
		allowReset,
		initialPosition,
		min,
		max,
		type,
		separatorType,
		...props
	} ) => {
		if ( type === 'stepper' ) {
			return (
				<StepperCell
					label={ label }
					max={ max }
					min={ min }
					onChange={ onChange }
					separatorType={ separatorType }
					value={ value }
				/>
			);
		}
		const id = `inspector-range-control-${ instanceId }`;
		const currentInputValue = currentInput === null ? value : currentInput;
		const initialSliderValue = isFinite( currentInputValue )
			? currentInputValue
			: initialPosition;

		return (
			<RangeCell
				label={ label }
				id={ id }
				help={ help }
				className={ className }
				onChange={ onChange }
				aria-describedby={ !! help ? `${ id }__help` : undefined }
				minimumValue={ min }
				maximumValue={ max }
				value={ value }
				beforeIcon={ beforeIcon }
				afterIcon={ afterIcon }
				allowReset={ allowReset }
				defaultValue={ initialSliderValue }
				separatorType={ separatorType }
				{ ...props }
			/>
		);
	}
);

export default RangeControl;
