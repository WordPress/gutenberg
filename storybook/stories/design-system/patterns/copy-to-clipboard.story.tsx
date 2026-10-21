import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyToClipboardExamples } from './copy-to-clipboard';

const meta = {
	title: 'Design System/Patterns/Copy to Clipboard',
	component: CopyToClipboardExamples,
	parameters: {
		controls: { disable: true },
	},
	tags: [ 'docs-only' ],
} satisfies Meta< typeof CopyToClipboardExamples >;

export default meta;

type Story = StoryObj< typeof meta >;

export const CopyExample: Story = {
	name: 'Copy example',
	render: () => <CopyToClipboardExamples />,
};
