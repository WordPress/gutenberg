/**
 * Internal dependencies
 */
import Disabled from '../';
import SelectControl from '../../select-control/';
import TextControl from '../../text-control/';
import TextareaControl from '../../textarea-control/';
import CheckboxControl from '../../checkbox-control/';
import RadioControl from '../../radio-control/';
import RangeControl from '../../range-control/';
import ToggleControl from '../../toggle-control/';
import FormFileUpload from '../../form-file-upload/';
import AnglePickerControl from '../../angle-picker-control/';

export default {
	title: 'Components/Disabled',
	component: Disabled,
};

export const _default = () => {
	return (
		<Disabled>
			<TextControl label="Text Control" />
			<TextareaControl label="TextArea Control" />
			<SelectControl
				label="Select Control"
				onChange={ () => {} }
				options={ [
					{ value: null, label: 'Select an option', disabled: true },
					{ value: 'a', label: 'Option A' },
					{ value: 'b', label: 'Option B' },
					{ value: 'c', label: 'Option C' },
				] }
			/>
			<CheckboxControl label="Checkbox Control" />
			<RadioControl
				label="Radio Control"
				options={ [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' },
				] }
			/>
			<RangeControl label="Range Control" min={ 2 } max={ 10 } />
			<ToggleControl label="Toggle Control" />
			<FormFileUpload accept="image/*">Upload</FormFileUpload>
			<AnglePickerControl />
		</Disabled>
	);
};
