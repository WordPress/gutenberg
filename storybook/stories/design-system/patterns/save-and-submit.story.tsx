import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	AutosaveFeatureListExample,
	SaveFormLayoutCardExample,
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

export const AutosaveFeatureList: Story = {
	name: 'Autosave feature list',
	render: () => <AutosaveFeatureListExample />,
};

export const SaveFormLayoutCard: Story = {
	name: 'Save form layout card',
	render: () => <SaveFormLayoutCardExample />,
};
