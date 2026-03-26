import { Menu } from '@base-ui/react/menu';
import { useState } from '@wordpress/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { fn } from 'storybook/test';

import { ConfirmDialog } from '../..';

const meta: Meta< typeof ConfirmDialog.Root > = {
	title: 'Design System/Components/ConfirmDialog',
	component: ConfirmDialog.Root,
	subcomponents: {
		'ConfirmDialog.Trigger': ConfirmDialog.Trigger,
		'ConfirmDialog.Popup': ConfirmDialog.Popup,
	},
	argTypes: {
		onOpenChange: { action: fn() },
	},
};
export default meta;

type Story = StoryObj< typeof ConfirmDialog.Root >;

/**
 * Standard confirmation dialog for reversible actions. The dialog can be
 * dismissed via backdrop click, Escape key, cancel, or confirm button.
 */
export const Default: Story = {
	args: {
		title: 'Move to trash?',
		children: (
			<>
				<ConfirmDialog.Trigger>Move to trash</ConfirmDialog.Trigger>
				<ConfirmDialog.Popup onConfirm={ action( 'onConfirm' ) }>
					This post will be moved to trash. You can restore it later.
				</ConfirmDialog.Popup>
			</>
		),
	},
};

/**
 * Confirmation dialog for irreversible actions that cannot be undone. Users can
 * dismiss the dialog via Escape key, cancel, or confirm button, but not via
 * backdrop click. The "confirm" action button uses error/danger coloring.
 */
export const Irreversible: Story = {
	args: {
		title: 'Delete permanently?',
		intent: 'irreversible',
		children: (
			<>
				<ConfirmDialog.Trigger>
					Delete permanently
				</ConfirmDialog.Trigger>
				<ConfirmDialog.Popup
					onConfirm={ action( 'onConfirm' ) }
					confirmButtonText="Delete permanently"
				>
					This action cannot be undone. All data will be lost.
				</ConfirmDialog.Popup>
			</>
		),
	},
};

/**
 * Example with custom button text for both confirm and cancel buttons.
 */
export const CustomButtonText: Story = {
	args: {
		title: 'Send feedback?',
		children: (
			<>
				<ConfirmDialog.Trigger>Send feedback</ConfirmDialog.Trigger>
				<ConfirmDialog.Popup
					onConfirm={ action( 'onConfirm' ) }
					confirmButtonText="Send feedback"
					cancelButtonText="Not now"
				>
					Your feedback helps us improve. Would you like to send it
					now?
				</ConfirmDialog.Popup>
			</>
		),
	},
};

const menuPopupStyles: React.CSSProperties = {
	background: 'var(--wpds-color-bg-surface-neutral-strong)',
	border: '1px solid var(--wpds-color-stroke-surface-neutral)',
	borderRadius: '8px',
	padding: '4px',
	minWidth: '160px',
	boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
};

const menuItemStyles: React.CSSProperties = {
	display: 'block',
	width: '100%',
	padding: '8px 12px',
	borderRadius: '4px',
	border: 'none',
	background: 'none',
	textAlign: 'start',
	fontSize: 'inherit',
	userSelect: 'none',
};

/**
 * Example showing composition with a menu. The `ConfirmDialog.Trigger` is
 * composed with Base UI's `Menu.Item` using the `render` prop, allowing the
 * menu item to directly trigger the confirm dialog.
 *
 * Note: the example currently uses the `Menu` component from BaseUI, although
 * consumers should not use BaseUI directly and instead use the DS `Menu`
 * component (not ready yet).
 */
export const MenuTrigger: Story = {
	args: {
		title: 'Delete permanently?',
		intent: 'irreversible',
	},
	render: ( args ) => {
		const [ menuOpen, setMenuOpen ] = useState( false );
		return (
			<>
				<Menu.Root onOpenChange={ setMenuOpen } open={ menuOpen }>
					<Menu.Trigger>Actions ▾</Menu.Trigger>
					<Menu.Portal>
						<Menu.Positioner>
							<Menu.Popup style={ menuPopupStyles }>
								<Menu.Item style={ menuItemStyles }>
									Edit
								</Menu.Item>
								<ConfirmDialog.Root { ...args }>
									<Menu.Item
										render={
											<ConfirmDialog.Trigger
												// Quick fix to remove `button`-specific styles.
												// This shouldn't be an issue once we use the DS `Menu`
												// component, which will come with item styles.
												render={ <div /> }
											/>
										}
										style={ menuItemStyles }
										closeOnClick={ false }
									>
										Delete...
										<ConfirmDialog.Popup
											onConfirm={ () => {
												setMenuOpen( false );
											} }
											confirmButtonText="Delete permanently"
										>
											This action cannot be undone. All
											data will be lost.
										</ConfirmDialog.Popup>
									</Menu.Item>
								</ConfirmDialog.Root>
							</Menu.Popup>
						</Menu.Positioner>
					</Menu.Portal>
				</Menu.Root>
			</>
		);
	},
};

/**
 * The `ConfirmDialog.Trigger` element is not necessary when the open state is
 * controlled externally. This is useful when the dialog needs to be opened
 * from code or from a non-standard trigger element.
 */
export const Controlled: Story = {
	render: function Controlled( args ) {
		const [ isOpen, setIsOpen ] = useState( false );

		return (
			<>
				<button onClick={ () => setIsOpen( true ) }>Open Dialog</button>
				<ConfirmDialog.Root
					{ ...args }
					open={ isOpen }
					onOpenChange={ ( open, eventDetails ) => {
						setIsOpen( open );
						args.onOpenChange?.( open, eventDetails );
					} }
				>
					<ConfirmDialog.Popup onConfirm={ action( 'onConfirm' ) }>
						This post will be moved to trash. You can restore it
						later.
					</ConfirmDialog.Popup>
				</ConfirmDialog.Root>
			</>
		);
	},
	args: {
		title: 'Move to trash?',
	},
};
