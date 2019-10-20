/**
 * Internal dependencies
 */
import RangeCell from '../mobile/bottom-sheet/range-cell';

function RangeControl( {
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
	// setState,
	...props
} ) {
	const id = `inspector-range-control-${ instanceId }`;

	const currentInputValue = currentInput === null ? value : currentInput;

	const initialSliderValue = isFinite( currentInputValue ) ? currentInputValue : initialPosition || '';

	return (
		<RangeCell
			label={ label }
			id={ id }
			help={ help }
			className={ className }
			onChangeValue={ onChange }
			aria-describedby={ !! help ? `${ id }__help` : undefined }
			min={ min }
			max={ max }
			value={ currentInputValue }
			beforeIcon={ beforeIcon }
			afterIcon={ afterIcon }
			allowReset={ allowReset }
			defaultValue={ initialSliderValue }
			{ ...props }
		/>
	);
}

export default RangeControl;
