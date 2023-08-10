/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { shortcutAriaLabel } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { ToolTip } from '..';
import type { ToolTipProps } from '../types';
import Button from '../../../button';

const meta: Meta< typeof ToolTip > = {
	title: 'Components/AriaToolTip',
	component: ToolTip,
	argTypes: {
		children: { control: { type: null } },
		position: {
			control: {
				type: 'select',
				options: [
					'top left',
					'top center',
					'top right',
					'bottom left',
					'bottom center',
					'bottom right',
				],
			},
		},
		shortcut: { control: { type: 'text' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: StoryFn< typeof ToolTip > = ( props: ToolTipProps ) => (
	<ToolTip { ...props } />
);

export const Default: StoryFn< typeof ToolTip > = Template.bind( {} );
Default.args = {
	children: <Button variant="primary">It&apos;s me.</Button>,
	text: 'Hi!',
};

export const KeyboardShortcut = Template.bind( {} );
KeyboardShortcut.args = {
	children: <Button variant="secondary">Keyboard shortcut</Button>,
	shortcut: {
		display: '⇧⌘,',
		ariaLabel: shortcutAriaLabel.primaryShift( ',' ),
	},
};
