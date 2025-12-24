/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { upload as uploadIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import FormFileUpload from '..';

const meta: Meta< typeof FormFileUpload > = {
	title: 'Components/Selection & Input/File Upload/FormFileUpload',
	id: 'components-formfileupload',
	component: FormFileUpload,
	argTypes: {
		icon: { control: false },
		onChange: { action: 'onChange', control: false },
		onClick: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof FormFileUpload > = ( props ) => {
	return <FormFileUpload { ...props } />;
};

export const Default = Template.bind( {} );
Default.args = {
	children: 'Select file',
	__next40pxDefaultSize: true,
};

export const RestrictFileTypes = Template.bind( {} );
RestrictFileTypes.args = {
	...Default.args,
	accept: 'image/*',
	children: 'Select image',
};

export const AllowMultipleFiles = Template.bind( {} );
AllowMultipleFiles.args = {
	...Default.args,
	children: 'Select files',
	multiple: true,
};

export const WithIcon = Template.bind( {} );
WithIcon.args = {
	...Default.args,
	children: 'Upload',
	icon: uploadIcon,
};

/**
 * Render a custom trigger button by passing a render function to the `render` prop.
 *
 * ```jsx
 * ( { openFileDialog } ) => <button onClick={ openFileDialog }>Custom Upload Button</button>
 * ```
 */
export const WithCustomRender = Template.bind( {} );
WithCustomRender.args = {
	...Default.args,
	render: ( { openFileDialog } ) => (
		<button onClick={ openFileDialog }>Custom Upload Button</button>
	),
};
