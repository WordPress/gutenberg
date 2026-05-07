/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
// eslint-disable-next-line @wordpress/use-recommended-components
import { Dialog } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import ItemActions, { ActionModal } from '../index';
import type { ActionModal as ActionModalType } from '../../../types';

type TestItem = { id: number; title: string };

function createAction(
	overrides: Partial< ActionModalType< TestItem > > = {}
): ActionModalType< TestItem > {
	return {
		id: 'test-action',
		label: 'Test Action',
		RenderModal: ( { closeModal } ) => (
			<div>
				<p>Modal content</p>
				<button onClick={ closeModal }>Done</button>
			</div>
		),
		...overrides,
	};
}

// Renders an `<ActionModal>` inside a controlled `<Dialog.Root>` so each
// test can drive the open state through `onOpenChange` (mirroring how
// the dataviews call sites — `ModalActionMenuItem`,
// `ModalActionInlineButton`, `PrimaryActionGridCell`, `ActionWithModal`
// — own the dialog state).
function renderActionModal( {
	action,
	items,
	open = true,
	onOpenChange = jest.fn(),
}: {
	action: ActionModalType< TestItem >;
	items: TestItem[];
	open?: boolean;
	onOpenChange?: ( open: boolean ) => void;
} ) {
	const closeModal = () => onOpenChange( false );
	return render(
		<Dialog.Root
			open={ open }
			// Wrap to drop the `eventDetails` second argument that
			// `Dialog.Root.onOpenChange` forwards, so tests can assert
			// `toHaveBeenCalledWith( false )` against the caller-provided
			// mock without coupling to the dialog primitive's signature.
			onOpenChange={ ( isOpen ) => onOpenChange( isOpen ) }
			disablePointerDismissal={ action.hideModalHeader }
		>
			<ActionModal
				action={ action }
				items={ items }
				closeModal={ closeModal }
			/>
		</Dialog.Root>
	);
}

describe( 'ActionModal', () => {
	it( 'renders with a dialog role by default', async () => {
		const action = createAction();

		renderActionModal( {
			action,
			items: [ { id: 1, title: 'Item' } ],
		} );

		await waitFor( () => {
			expect( screen.getByRole( 'dialog' ) ).toBeVisible();
		} );
	} );

	it( 'renders with an alertdialog role when hideModalHeader is true', async () => {
		const action = createAction( { hideModalHeader: true } );

		renderActionModal( {
			action,
			items: [ { id: 1, title: 'Item' } ],
		} );

		await waitFor( () => {
			expect( screen.getByRole( 'alertdialog' ) ).toBeVisible();
		} );
	} );

	it( "maps modalSize 'fill' to 'stretch' and emits a deprecation warning", async () => {
		const action = createAction( {
			modalSize: 'fill',
		} );

		renderActionModal( {
			action,
			items: [ { id: 1, title: 'Item' } ],
		} );

		await waitFor( () => {
			expect( screen.getByRole( 'dialog' ) ).toBeVisible();
		} );

		expect( console ).toHaveWarnedWith(
			"modalSize: 'fill' is deprecated since version 15.0.0. Please use 'stretch' instead."
		);
	} );

	it( 'focuses the first input when modalFocusOnMount is "firstInputElement"', async () => {
		const action = createAction( {
			modalFocusOnMount: 'firstInputElement',
			RenderModal: () => (
				<div>
					<p>Some text</p>
					<input type="text" data-testid="first-input" />
					<input type="text" data-testid="second-input" />
				</div>
			),
		} );

		renderActionModal( {
			action,
			items: [ { id: 1, title: 'Item' } ],
		} );

		await waitFor( () => {
			expect( screen.getByTestId( 'first-input' ) ).toHaveFocus();
		} );
	} );

	it( 'falls back to the popup smart default when modalFocusOnMount is unset', async () => {
		// `Dialog.Popup`'s default focus-on-mount lands on the first
		// content tabbable rather than the close icon.
		const action = createAction( {
			RenderModal: () => (
				<div>
					<p>Some text</p>
					<button data-testid="content-button">Content button</button>
				</div>
			),
		} );

		renderActionModal( {
			action,
			items: [ { id: 1, title: 'Item' } ],
		} );

		await waitFor( () => {
			expect( screen.getByTestId( 'content-button' ) ).toHaveFocus();
		} );
	} );

	it.each( [ 'small', 'medium', 'large', 'stretch' ] as const )(
		'forwards modalSize %p to Dialog.Popup without emitting a deprecation warning',
		async ( modalSize ) => {
			const action = createAction( { modalSize } );

			renderActionModal( {
				action,
				items: [ { id: 1, title: 'Item' } ],
			} );

			await screen.findByRole( 'dialog' );
			expect( console ).not.toHaveWarned();
		}
	);

	it( 'renders the popup inside the dataviews-action-modal__portal element', async () => {
		const action = createAction();

		renderActionModal( {
			action,
			items: [ { id: 1, title: 'Item' } ],
		} );

		const dialog = await screen.findByRole( 'dialog' );
		// The portal is a structural CSS wrapper with no semantic role, so
		// there's no Testing Library query that can reach it directly.
		// Walking up the tree is the most precise way to assert the popup
		// renders inside the scoped portal that owns the per-instance
		// `--wp-ui-dialog-z-index` override.
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			dialog.closest( '.dataviews-action-modal__portal' )
		).not.toBeNull();
	} );

	it( 'closes when the user presses Escape', async () => {
		const user = userEvent.setup();
		const onOpenChange = jest.fn();
		const action = createAction();

		renderActionModal( {
			action,
			items: [ { id: 1, title: 'Item' } ],
			onOpenChange,
		} );

		await screen.findByRole( 'dialog' );
		await user.keyboard( '{Escape}' );

		expect( onOpenChange ).toHaveBeenCalledWith( false );
	} );

	it( 'closes when the user clicks the backdrop by default', async () => {
		const user = userEvent.setup();
		const onOpenChange = jest.fn();
		const action = createAction();

		renderActionModal( {
			action,
			items: [ { id: 1, title: 'Item' } ],
			onOpenChange,
		} );

		await screen.findByRole( 'dialog' );
		const backdrop = screen.getByTestId( 'dialog-backdrop' );
		await user.click( backdrop );

		expect( onOpenChange ).toHaveBeenCalledWith( false );
	} );

	it( 'does not close on backdrop click for alert dialogs (hideModalHeader)', async () => {
		const user = userEvent.setup();
		const onOpenChange = jest.fn();
		const action = createAction( { hideModalHeader: true } );

		renderActionModal( {
			action,
			items: [ { id: 1, title: 'Item' } ],
			onOpenChange,
		} );

		await screen.findByRole( 'alertdialog' );
		const backdrop = screen.getByTestId( 'dialog-backdrop' );
		await user.click( backdrop );

		expect( onOpenChange ).not.toHaveBeenCalled();
	} );

	it( 'invokes onOpenChange(false) when the RenderModal calls closeModal', async () => {
		const user = userEvent.setup();
		const onOpenChange = jest.fn();
		const action = createAction();

		renderActionModal( {
			action,
			items: [ { id: 1, title: 'Item' } ],
			onOpenChange,
		} );

		await screen.findByRole( 'dialog' );
		await user.click( screen.getByRole( 'button', { name: /done/i } ) );

		expect( onOpenChange ).toHaveBeenCalledWith( false );
	} );
} );

describe( 'ItemActions — kebab menu → modal action', () => {
	// Regression coverage for the composition between `Menu.Popover`
	// (`unmountOnHide` + `Menu.Item.hideOnClick`) and the per-action
	// `Dialog.Root` that owns each modal action's open state. The bug:
	// hosting `Dialog.Root` inside the compact menu's popover means the
	// dialog mounts and immediately unmounts when the menu hides on
	// `Menu.Item` click, so consumers can't reach the modal body. These
	// tests assert that selecting a modal action from the kebab menu
	// opens its dialog and that the dialog body remains interactive long
	// enough to dispatch its own actions.
	const item = { id: 1, title: 'Item' };

	function createMenuModalAction(
		overrides: Partial< ActionModalType< TestItem > > = {}
	): ActionModalType< TestItem > {
		return {
			id: 'menu-modal-action',
			label: 'Menu modal action',
			RenderModal: ( { closeModal } ) => (
				<div>
					<p data-testid="menu-modal-content">Menu modal content</p>
					<button onClick={ closeModal }>Done</button>
				</div>
			),
			...overrides,
		};
	}

	it( 'opens the dialog when a modal action is selected from the kebab menu', async () => {
		const user = userEvent.setup();
		const action = createMenuModalAction();

		render(
			<ItemActions item={ item } actions={ [ action ] } isCompact />
		);

		await user.click( screen.getByRole( 'button', { name: /actions/i } ) );
		await user.click(
			screen.getByRole( 'menuitem', { name: /menu modal action/i } )
		);

		// The dialog body must be mounted and reachable after the menu
		// closes; on the buggy host it unmounts together with the menu
		// popover and the assertion times out.
		await waitFor( () => {
			expect(
				screen.getByTestId( 'menu-modal-content' )
			).toBeInTheDocument();
		} );
		expect(
			screen.getByRole( 'button', { name: /done/i } )
		).toBeInTheDocument();
	} );

	it( 'keeps the dialog interactive — closeModal from the body still dismisses it', async () => {
		const user = userEvent.setup();
		const action = createMenuModalAction();

		render(
			<ItemActions item={ item } actions={ [ action ] } isCompact />
		);

		await user.click( screen.getByRole( 'button', { name: /actions/i } ) );
		await user.click(
			screen.getByRole( 'menuitem', { name: /menu modal action/i } )
		);

		const doneButton = await screen.findByRole( 'button', {
			name: /done/i,
		} );
		await user.click( doneButton );

		await waitFor( () => {
			expect(
				screen.queryByTestId( 'menu-modal-content' )
			).not.toBeInTheDocument();
		} );
	} );
} );
