import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import * as Dialog from '../index';

const meta: Meta< typeof Dialog.Root > = {
	title: 'Design System/Dialog',
	component: Dialog.Root,
	subcomponents: {
		'Dialog.Trigger': Dialog.Trigger,
		'Dialog.Popup': Dialog.Popup,
		'Dialog.Header': Dialog.Header,
		'Dialog.Heading': Dialog.Heading,
		'Dialog.CloseIcon': Dialog.CloseIcon,
		'Dialog.Action': Dialog.Action,
		'Dialog.Footer': Dialog.Footer,
	},
	args: {
		title: 'Dialog Title',
	},
	parameters: {
		docs: {
			description: {
				component: `
When using the Dialog component, make sure to always include a visible close button, either \`Dialog.CloseIcon\` or a clear dismissing action button. If your dialog has a "Cancel" button in the footer, the close icon may be redundant and create confusion about what clicking "X" means.

Use \`Dialog.CloseIcon\` for informational dialogs where dismissing is safe and expected. For dialogs requiring explicit user choice (especially destructive actions), omit the close icon and rely on footer action buttons like "Cancel" and "Confirm" instead.
				`,
			},
		},
	},
};
export default meta;

type Story = StoryObj< typeof Dialog.Root >;

function DialogWithSize( {
	size,
}: Pick< ComponentProps< typeof Dialog.Popup >, 'size' > ) {
	return (
		<>
			<Dialog.Trigger>Open Dialog</Dialog.Trigger>
			<Dialog.Popup size={ size }>
				<Dialog.Header>
					<Dialog.Heading />
					<Dialog.CloseIcon />
				</Dialog.Header>
				<p>
					This dialog demonstrates best practices for informational
					dialogs. It includes a close icon because dismissing it is
					safe and expected.
				</p>
				<CheckboxControl label="Don't show this again" />
				<Dialog.Footer>
					<Dialog.Action>Got it</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Popup>
		</>
	);
}

/**
 * An informational dialog with a close icon, where there is no ambiguity on
 * what happens when clicking the close icon.
 */
export const Default: Story = {
	args: {
		title: 'Welcome',
		children: <DialogWithSize />,
	},
};

/**
 * A confirmation dialog that intentionally omits the close icon. The user
 * must explicitly choose "Cancel" or "Confirm" to make their intent clear,
 * since it is not obvious what would happen when clicking a close icon.
 */
export const ConfirmDialog: Story = {
	args: {
		title: 'Confirm Action',
		children: (
			<>
				<Dialog.Trigger>Confirm Action</Dialog.Trigger>
				<Dialog.Popup>
					<Dialog.Header>
						<Dialog.Heading />
					</Dialog.Header>
					<p>
						Are you sure you want to proceed? This action cannot be
						undone.
					</p>
					<Dialog.Footer>
						<Dialog.Action variant="outline">Cancel</Dialog.Action>
						<Dialog.Action>Confirm</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</>
		),
	},
};

export const SmallSize: Story = {
	...Default,
	args: {
		...Default.args,
		children: <DialogWithSize size="small" />,
	},
};

export const MediumSize: Story = {
	...Default,
	args: {
		...Default.args,
		children: <DialogWithSize size="medium" />,
	},
};

export const LargeSize: Story = {
	...Default,
	args: {
		...Default.args,
		children: <DialogWithSize size="large" />,
	},
};
