/**
 * WordPress dependencies
 */
import { TextareaControl } from '@wordpress/components';

interface CategoryRowProps {
	label: string;
	description: string;
	value: string;
	onChange: ( value: string ) => void;
	maxLength?: number;
}

/**
 * Category row component for displaying a single guideline category in tabular layout.
 *
 * @param props             Component props.
 * @param props.label       Row label.
 * @param props.description Help text for the textarea.
 * @param props.value       Current value of the textarea.
 * @param props.onChange    Callback when value changes.
 * @param props.maxLength   Maximum length for the textarea.
 *                          Default is 5000.
 * @return CategoryRow component.
 */
export default function CategoryRow( {
	label,
	description,
	value,
	onChange,
	maxLength,
}: CategoryRowProps ) {
	return (
		<tr>
			<th scope="row">{ label }</th>
			<td>
				<TextareaControl
					__nextHasNoMarginBottom
					label={ label }
					hideLabelFromVision
					value={ value }
					onChange={ onChange }
					rows={ 6 }
					help={ description }
					maxLength={ maxLength }
				/>
			</td>
		</tr>
	);
}
