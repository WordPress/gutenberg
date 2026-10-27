import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyFromMenuExample } from './copy-from-menu';

const meta = {
	title: 'Design System/Patterns/Copy to Clipboard',
	component: CopyFromMenuExample,
	parameters: {
		controls: { disable: true },
	},
	tags: [ 'docs-only' ],
} satisfies Meta< typeof CopyFromMenuExample >;

export default meta;

type Story = StoryObj< typeof meta >;

export const CopyFromMenu: Story = {
	name: 'Copy from a menu',
	render: () => <CopyFromMenuExample />,
};
