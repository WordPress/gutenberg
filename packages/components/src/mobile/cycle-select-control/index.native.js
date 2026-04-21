/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import CyclePickerCell from '../bottom-sheet/cycle-picker-cell';

function CycleSelectControl( {
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
		<CyclePickerCell
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

export default memo( CycleSelectControl );
