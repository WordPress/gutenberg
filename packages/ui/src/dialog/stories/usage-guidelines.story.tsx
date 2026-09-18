import type { Meta, StoryObj } from '@storybook/react-vite';
import * as AlertDialog from '../../alert-dialog';
import * as Drawer from '../../drawer';
import { InputControl } from '../../form/input-control';
import { Field, Textarea } from '../../form/primitives';
import { Stack } from '../../stack';
import * as Dialog from '../index';

const meta: Meta = {
	title: 'Design System/Components/Dialog/Usage Guidelines',
	parameters: {
		controls: { disable: true },
	},
	tags: [ '!dev' /* Hide individual story pages from sidebar */ ],
};
export default meta;

type Story = StoryObj;

/**
 * Dialog works well for a focused task with one primary action that can be
 * opened from many places without needing surrounding page context.
 */
export const DialogForFocusedTask: Story = {
	render: () => (
		<Dialog.Root>
			<Dialog.Trigger>Add tax rate</Dialog.Trigger>
			<Dialog.Popup size="small">
				<Dialog.Header>
					<Dialog.Title>Add tax rate</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="sm">
						<Dialog.Description>
							Enter a name and percentage for the new tax rate.
						</Dialog.Description>
						<InputControl
							label="Name"
							defaultValue="Standard rate"
						/>
						<InputControl
							label="Rate (%)"
							type="number"
							defaultValue="8.5"
						/>
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					<Dialog.Action variant="outline">Cancel</Dialog.Action>
					<Dialog.Action>Add tax rate</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	),
};

/**
 * AlertDialog is appropriate when the overlay is a deliberate interruption,
 * such as confirming a destructive action.
 */
export const AlertDialogForDeliberateInterruption: Story = {
	render: () => (
		<AlertDialog.Root>
			<AlertDialog.Trigger>Remove customer</AlertDialog.Trigger>
			<AlertDialog.Popup
				intent="irreversible"
				title="Remove customer?"
				description="This customer will lose access to their account. This action cannot be undone."
				confirmButtonText="Remove customer"
			/>
		</AlertDialog.Root>
	),
};

/**
 * Drawer fits contextual editing where the user benefits from keeping the
 * underlying page visible while working through multiple fields or sections.
 */
export const DrawerForContextualEditing: Story = {
	render: () => (
		<Drawer.Root modal={ false } swipeDirection="right">
			<Drawer.Trigger>Edit order details</Drawer.Trigger>
			<Drawer.Popup size="medium">
				<Drawer.Header>
					<Drawer.Title>Order details</Drawer.Title>
					<Drawer.CloseIcon />
				</Drawer.Header>
				<Drawer.Content>
					<Stack direction="column" gap="md">
						<InputControl
							label="Customer name"
							defaultValue="Alex Rivera"
						/>
						<Field.Root>
							<Field.Label>Shipping address</Field.Label>
							<Textarea
								defaultValue={
									'123 Market Street\nSan Francisco, CA 94103'
								}
								rows={ 3 }
							/>
						</Field.Root>
						<Field.Root>
							<Field.Label>Internal note</Field.Label>
							<Textarea
								defaultValue="Gift wrap requested."
								rows={ 2 }
							/>
						</Field.Root>
					</Stack>
				</Drawer.Content>
				<Drawer.Footer>
					<Drawer.Action variant="outline">Cancel</Drawer.Action>
					<Drawer.Action>Save changes</Drawer.Action>
				</Drawer.Footer>
			</Drawer.Popup>
		</Drawer.Root>
	),
};
