import type { Meta, StoryObj } from '@storybook/react-vite';
import { KeyboardShortcut } from '../';

const meta: Meta< typeof KeyboardShortcut > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/KeyboardShortcut',
	id: 'design-system-components-keyboardshortcut',
	component: KeyboardShortcut,
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
	args: {
		keyCombination: { modifier: 'primaryShift', character: ',' },
	},
};
export default meta;

type Story = StoryObj< typeof KeyboardShortcut >;

export const Default: Story = {};

export const Standalone: Story = {
	args: { keyCombination: { character: '+' } },
};

export const KeyGroup: Story = {
	args: {
		keyCombination: { character: [ '↑', '↓', '←', '→' ] },
		label: 'Arrow keys',
	},
};
