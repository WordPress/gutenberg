import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	AutosaveFeatureListExample,
	InvalidFieldsExample,
	SaveFormLayoutCardExample,
	UnsavedChangesOnExitExample,
} from './save-and-submit';

const meta = {
	title: 'Design System/Patterns/Save & Submit',
	component: SaveFormLayoutCardExample,
	parameters: {
		controls: { disable: true },
	},
	tags: [ 'docs-only' ],
} satisfies Meta< typeof SaveFormLayoutCardExample >;

export default meta;

type Story = StoryObj< typeof meta >;

export const SaveFormLayoutCard: Story = {
	name: 'Save form layout card',
	render: () => <SaveFormLayoutCardExample />,
};

export const UnsavedChangesOnExit: Story = {
	name: 'Unsaved changes on exit',
	render: () => <UnsavedChangesOnExitExample />,
};

export const InvalidFields: Story = {
	name: 'Invalid fields',
	render: () => <InvalidFieldsExample />,
};

export const AutosaveFeatureList: Story = {
	name: 'Autosave feature list',
	render: () => <AutosaveFeatureListExample />,
};

export const AutosaveFailure: Story = {
	name: 'Autosave failure',
	render: () => <AutosaveFeatureListExample failingFeature="relatedPosts" />,
};
