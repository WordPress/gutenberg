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
	title: 'Components/FormFileUpload',
	component: FormFileUpload,
	argTypes: {
		icon: { control: { type: null } },
		onChange: { action: 'onChange', control: { type: null } },
		onClick: { control: { type: null } },
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
