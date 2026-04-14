import { Menu } from '@base-ui/react/menu';
import { useId, useState } from '@wordpress/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { fn } from 'storybook/test';

import { AlertDialog, Text } from '../..';

const meta: Meta< typeof AlertDialog.Root > = {
	title: 'Design System/Components/AlertDialog',
	component: AlertDialog.Root,
	subcomponents: {
		'AlertDialog.Trigger': AlertDialog.Trigger,
		'AlertDialog.Popup': AlertDialog.Popup,
	},
	argTypes: {
		onConfirm: { action: fn() },
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
					description="This post will be moved to trash. You can restore it later."
				/>
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
		children: (
			<>
				<AlertDialog.Trigger>Delete permanently</AlertDialog.Trigger>
				<AlertDialog.Popup
					intent="irreversible"
					title="Delete permanently?"
					description="This action cannot be undone. All data will be lost."
					confirmButtonText="Delete permanently"
				/>
			</>
		),
	},
};

/**
 * Example with custom button labels for both confirm and cancel buttons.
 */
export const CustomLabels: Story = {
	args: {
		children: (
			<>
				<AlertDialog.Trigger>Send feedback</AlertDialog.Trigger>
				<AlertDialog.Popup
					title="Send feedback?"
					description="Your feedback helps us improve. Would you like to send it now?"
					confirmButtonText="Send feedback"
					cancelButtonText="Not now"
				/>
			</>
		),
	},
};

/**
 * Use `children` to render custom content between the description and the
 * action buttons. The `description` should be self-contained for
 * accessibility (`aria-describedby`); `children` adds supplementary detail.
 */
export const WithCustomContent: Story = {
	args: {
		children: (
			<>
				<AlertDialog.Trigger>Remove pages</AlertDialog.Trigger>
				<AlertDialog.Popup
					title="Remove 3 pages?"
					description="These pages will be moved to trash."
					confirmButtonText="Delete pages"
				>
					<ul
						style={ {
							margin: 0,
							paddingInlineStart: 'var(--wpds-dimension-gap-lg)',
						} }
					>
						<Text render={ <li /> }>About us</Text>
						<Text render={ <li /> }>Contact</Text>
						<Text render={ <li /> }>Privacy policy</Text>
					</ul>
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
	render: () => {
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
								<AlertDialog.Root
									onConfirm={ () => {
										setMenuOpen( false );
										action( 'onConfirm' )();
									} }
								>
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
											intent="irreversible"
											title="Delete permanently?"
											description="This action cannot be undone. All data will be lost."
											confirmButtonText="Delete permanently"
										/>
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

function sleep( ms: number ) {
	return new Promise< void >( ( resolve ) => setTimeout( resolve, ms ) );
}

/**
 * Async confirm flow. The consumer returns a promise from `onConfirm`.
 * The dialog automatically manages the pending state: buttons are disabled
 * and a spinner appears on the confirm button. Toggle between success and
 * failure to test both outcomes.
 *
 * On failure, the consumer catches the error and returns
 * `{ close: false, error: '...' }`. The component displays the message
 * below the action buttons and announces it to screen readers. The error
 * is automatically cleared on the next confirm attempt or when the dialog
 * reopens.
 */
export const AsyncConfirm: Story = {
	render: function AsyncConfirm( args ) {
		const [ shouldFail, setShouldFail ] = useState( false );
		const successId = useId();
		const failureId = useId();

		return (
			<>
				<fieldset>
					<legend>Async task outcome</legend>
					<label htmlFor={ successId }>
						<input
							id={ successId }
							type="radio"
							name="async-outcome"
							checked={ ! shouldFail }
							onChange={ () => setShouldFail( false ) }
						/>
						Success (closes dialog)
					</label>
					<label
						htmlFor={ failureId }
						style={ { marginInlineStart: 12 } }
					>
						<input
							id={ failureId }
							type="radio"
							name="async-outcome"
							checked={ shouldFail }
							onChange={ () => setShouldFail( true ) }
						/>
						Failure (dialog stays open, shows error)
					</label>
				</fieldset>
				<br />
				<AlertDialog.Root
					{ ...args }
					onConfirm={ async () => {
						action( 'onConfirm' )();
						try {
							await sleep( 2000 );
							if ( shouldFail ) {
								throw new Error( 'Task failed' );
							}
						} catch {
							return {
								close: false,
								error: 'Something went wrong. Please try again.',
							};
						}
						return undefined;
					} }
				>
					<AlertDialog.Trigger>
						Delete permanently
					</AlertDialog.Trigger>
					<AlertDialog.Popup
						intent="irreversible"
						title="Delete permanently?"
						description="This action cannot be undone. All data will be lost."
						confirmButtonText="Delete permanently"
					/>
				</AlertDialog.Root>
			</>
		);
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
						description="This post will be moved to trash. You can restore it later."
					/>
				</AlertDialog.Root>
			</>
		);
	},
};
