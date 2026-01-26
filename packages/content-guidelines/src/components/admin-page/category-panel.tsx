/**
 * WordPress dependencies
 */
import { PanelBody, TextareaControl } from '@wordpress/components';

interface CategoryPanelProps {
	label: string;
	description: string;
	value: string;
	onChange: ( value: string ) => void;
}

/**
 * Category panel component for displaying a single guideline category.
 *
 * @param props             Component props.
 * @param props.label       Panel label/title.
 * @param props.description Help text for the textarea.
 * @param props.value       Current value of the textarea.
 * @param props.onChange    Callback when value changes.
 * @return CategoryPanel component.
 */
export default function CategoryPanel( {
	label,
	description,
	value,
	onChange,
}: CategoryPanelProps ) {
	return (
		<PanelBody title={ label } initialOpen={ false }>
			<TextareaControl
				__nextHasNoMarginBottom
				help={ description }
				value={ value }
				onChange={ onChange }
				rows={ 6 }
				className="content-guidelines-textarea"
			/>
		</PanelBody>
	);
}
