/**
 * Internal dependencies
 */
import PickerCell from '../mobile/bottom-sheet/picker-cell';

function SelectControl( {
	help,
	instanceId,
	label,
	multiple = false,
	onChange,
	options = [],
	className,
	hideLabelFromVision,
	...props
} ) {
	const id = `inspector-select-control-${ instanceId }`;

	return (
		<PickerCell
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			id={ id }
			help={ help }
			className={ className }
			onChangeValue={ onChange }
			aria-describedby={ !! help ? `${ id }__help` : undefined }
			multiple={ multiple }
			options={ options }
			{ ...props }
		/>
	);
}

export default SelectControl;
