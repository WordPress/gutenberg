import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyFromFieldExamples } from './copy-from-field';

const meta = {
	title: 'Design System/Patterns/Copy from Field',
	component: CopyFromFieldExamples,
	parameters: {
		controls: { disable: true },
	},
	tags: [ 'docs-only' ],
} satisfies Meta< typeof CopyFromFieldExamples >;

export default meta;

type Story = StoryObj< typeof meta >;

export const CopyFromField: Story = {
	name: 'Copy from a text field',
	render: () => <CopyFromFieldExamples />,
};
