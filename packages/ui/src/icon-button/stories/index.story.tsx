import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	cog,
	copy,
	download,
	pencil,
	plus,
	trash,
	upload,
	wordpress,
} from '@wordpress/icons';
import { displayShortcut, ariaKeyShortcut } from '@wordpress/keycodes';
import { IconButton } from '../index';

const meta: Meta< typeof IconButton > = {
	title: 'Design System/Components/IconButton',
	component: IconButton,
	argTypes: {
		'aria-pressed': {
			control: { type: 'boolean' },
		},
	},
};
export default meta;

type Story = StoryObj< typeof IconButton >;

export const Default: Story = {
	args: {
		icon: cog,
		label: 'Settings',
	},
};

export const Outline: Story = {
	...Default,
	args: {
		...Default.args,
		variant: 'outline',
	},
};

export const Minimal: Story = {
	...Default,
	args: {
		...Default.args,
		variant: 'minimal',
	},
};

export const Neutral: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
		label: 'Settings',
	},
};

export const NeutralOutline: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
		variant: 'outline',
		label: 'Settings',
	},
};

export const Disabled: Story = {
	...Default,
	args: {
		...Default.args,
		disabled: true,
		label: 'Settings',
	},
};

export const WithDifferentIcons: Story = {
	...Default,
	render: ( args ) => (
		<div
			style={ {
				display: 'flex',
				gap: '1rem',
				alignItems: 'center',
				flexWrap: 'wrap',
			} }
		>
			<IconButton { ...args } icon={ wordpress } label="WordPress" />
			<IconButton { ...args } icon={ plus } label="Add" />
			<IconButton { ...args } icon={ pencil } label="Edit" />
			<IconButton { ...args } icon={ trash } label="Delete" />
			<IconButton { ...args } icon={ download } label="Download" />
			<IconButton { ...args } icon={ upload } label="Upload" />
		</div>
	),
};

/**
 * The pressed state is only available for buttons with `tone="neutral"` and
 * `variant="minimal"` and can be toggled via the `aria-pressed` HTML attribute.
 */
export const Pressed: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
		variant: 'minimal',
		label: 'Toggle Settings',
		'aria-pressed': true,
	},
};

const EXAMPLE_SHORTCUT_OBJECT = {
	displayShortcut: displayShortcut.primary( 'c' ),
	ariaKeyShortcut: ariaKeyShortcut.primary( 'c' ),
};

export const WithShortcut: Story = {
	...Default,
	args: {
		...Default.args,
		icon: copy,
		label: 'Copy',
		shortcut: EXAMPLE_SHORTCUT_OBJECT,
	},
};
