import { Menu } from '@base-ui/react/menu';
import { useState } from '@wordpress/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { fn } from 'storybook/test';

import { AlertDialog } from '../..';

const meta: Meta< typeof AlertDialog.Root > = {
	title: 'Design System/Components/AlertDialog',
	component: AlertDialog.Root,
	subcomponents: {
		'AlertDialog.Trigger': AlertDialog.Trigger,
		'AlertDialog.Popup': AlertDialog.Popup,
	},
	argTypes: {
		onOpenChange: { action: fn() },
	},
};
export default meta;

type Story = StoryObj< typeof AlertDialog.Root >;

/**
 * Standard confirmation dialog for reversible actions. The dialog can be
 * dismissed via Escape key or the cancel/confirm buttons. Backdrop click
 * is blocked.
 */
export const Default: Story = {
	args: {
		children: (
			<>
				<AlertDialog.Trigger>Move to trash</AlertDialog.Trigger>
				<AlertDialog.Popup
					title="Move to trash?"
					onConfirm={ action( 'onConfirm' ) }
				>
					This post will be moved to trash. You can restore it later.
				</AlertDialog.Popup>
			</>
		),
	},
};

/**
 * Confirmation dialog for irreversible actions that cannot be undone.
 * The confirm button uses error/danger coloring.
 */
export const Irreversible: Story = {
	args: {
		intent: 'irreversible',
		children: (
			<>
				<AlertDialog.Trigger>Delete permanently</AlertDialog.Trigger>
				<AlertDialog.Popup
					title="Delete permanently?"
					onConfirm={ action( 'onConfirm' ) }
					confirmButtonText="Delete permanently"
				>
					This action cannot be undone. All data will be lost.
				</AlertDialog.Popup>
			</>
		),
	},
};

/**
 * Example with custom button text for both confirm and cancel buttons.
 */
export const CustomButtonText: Story = {
	args: {
		children: (
			<>
				<AlertDialog.Trigger>Send feedback</AlertDialog.Trigger>
				<AlertDialog.Popup
					title="Send feedback?"
					onConfirm={ action( 'onConfirm' ) }
					confirmButtonText="Send feedback"
					cancelButtonText="Not now"
				>
					Your feedback helps us improve. Would you like to send it
					now?
				</AlertDialog.Popup>
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
 * Example showing composition with a menu. The `AlertDialog.Trigger` is
 * composed with Base UI's `Menu.Item` using the `render` prop, allowing the
 * menu item to directly trigger the alert dialog.
 *
 * Note: the example currently uses the `Menu` component from BaseUI, although
 * consumers should not use BaseUI directly and instead use the DS `Menu`
 * component (not ready yet).
 */
export const MenuTrigger: Story = {
	args: {
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
								<AlertDialog.Root { ...args }>
									<Menu.Item
										render={
											<AlertDialog.Trigger
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
										<AlertDialog.Popup
											title="Delete permanently?"
											onConfirm={ () => {
												setMenuOpen( false );
												action( 'onConfirm' )();
											} }
											confirmButtonText="Delete permanently"
										>
											This action cannot be undone. All
											data will be lost.
										</AlertDialog.Popup>
									</Menu.Item>
								</AlertDialog.Root>
							</Menu.Popup>
						</Menu.Positioner>
					</Menu.Portal>
				</Menu.Root>
			</>
		);
	},
};

/**
 * Consumer-driven async confirm flow. The consumer uses controlled mode to
 * keep the dialog open while the async operation is in progress, and passes
 * `loading` to show a spinner on the confirm button and disable the cancel
 * button.
 */
export const AsyncConfirm: Story = {
	render: function AsyncConfirm( args ) {
		const [ isOpen, setIsOpen ] = useState( false );
		const [ isLoading, setIsLoading ] = useState( false );

		return (
			<>
				<button onClick={ () => setIsOpen( true ) }>
					Delete permanently
				</button>
				<AlertDialog.Root
					{ ...args }
					open={ isOpen }
					onOpenChange={ ( open, eventDetails ) => {
						if ( ! isLoading ) {
							setIsOpen( open );
						}
						args.onOpenChange?.( open, eventDetails );
					} }
				>
					<AlertDialog.Popup
						title="Delete permanently?"
						loading={ isLoading }
						onConfirm={ () => {
							action( 'onConfirm' )();
							setIsLoading( true );
							new Promise< void >( ( resolve ) =>
								setTimeout( resolve, 2000 )
							).then( () => {
								setIsLoading( false );
								setIsOpen( false );
							} );
						} }
						confirmButtonText="Delete permanently"
					>
						This action cannot be undone. All data will be lost.
					</AlertDialog.Popup>
				</AlertDialog.Root>
			</>
		);
	},
	args: {
		intent: 'irreversible',
	},
};

/**
 * The `AlertDialog.Trigger` element is not necessary when the open state is
 * controlled externally. This is useful when the dialog needs to be opened
 * from code or from a non-standard trigger element.
 */
export const Controlled: Story = {
	render: function Controlled( args ) {
		const [ isOpen, setIsOpen ] = useState( false );

		return (
			<>
				<button onClick={ () => setIsOpen( true ) }>Open Dialog</button>
				<AlertDialog.Root
					{ ...args }
					open={ isOpen }
					onOpenChange={ ( open, eventDetails ) => {
						setIsOpen( open );
						args.onOpenChange?.( open, eventDetails );
					} }
				>
					<AlertDialog.Popup
						title="Move to trash?"
						onConfirm={ action( 'onConfirm' ) }
					>
						This post will be moved to trash. You can restore it
						later.
					</AlertDialog.Popup>
				</AlertDialog.Root>
			</>
		);
	},
};
