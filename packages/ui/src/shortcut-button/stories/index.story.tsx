import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	ariaKeyShortcut,
	displayShortcut,
	shortcutAriaLabel,
} from '@wordpress/keycodes';
import { ShortcutButton } from '../index';
import * as Tooltip from '../../tooltip';

const EXAMPLE_SHORTCUT = {
	displayShortcut: displayShortcut.primary( 's' ),
	ariaKeyShortcut: ariaKeyShortcut.primary( 's' ),
	description: shortcutAriaLabel.primary( 's' ),
};

const meta: Meta< typeof ShortcutButton > = {
	title: 'Design System/Components/ShortcutButton',
	component: ShortcutButton,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, text overflow behavior, and overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof ShortcutButton >;

export const Default: Story = {
	args: {
		children: 'Save',
		shortcut: EXAMPLE_SHORTCUT,
	},
};

export const Disabled: Story = {
	...Default,
	args: {
		...Default.args,
		disabled: true,
	},
};

/**
 * Customize where the tooltip appears relative to the button by passing a
 * `<Tooltip.Positioner />` element with a `side` to the `positioner` prop.
 */
export const WithCustomPositioner: Story = {
	...Default,
	args: {
		...Default.args,
		positioner: <Tooltip.Positioner side="right" />,
	},
};
