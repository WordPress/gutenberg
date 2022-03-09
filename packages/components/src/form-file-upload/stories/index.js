/**
 * WordPress dependencies
 */
import { upload as uploadIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import FormFileUpload from '../';

export default {
	title: 'Components/FormFileUpload',
	component: FormFileUpload,
};

export const Default = FormFileUpload.bind( {} );
Default.args = {
	accept: '',
	children: 'Select file',
	multiple: false,
};

export const RestrictFileTypes = FormFileUpload.bind( {} );
RestrictFileTypes.args = {
	...Default.args,
	accept: 'image/*',
	children: 'Select image',
	multiple: false,
};

export const AllowMultipleFiles = FormFileUpload.bind( {} );
AllowMultipleFiles.args = {
	...Default.args,
	children: 'Select files',
	multiple: true,
};

export const WithIcon = FormFileUpload.bind( {} );
WithIcon.args = {
	...Default.args,
	children: 'Upload',
	icon: uploadIcon,
};

export const WithCustomRender = FormFileUpload.bind( {} );
WithCustomRender.args = {
	...Default.args,
	render: ( { openFileDialog } ) => (
		<button onClick={ openFileDialog }>Custom Upload Button</button>
	),
};
