/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { ActionModal } from '../index';
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

describe( 'ActionModal', () => {
	it( 'renders with a dialog role by default', async () => {
		const action = createAction();

		render(
			<ActionModal
				action={ action }
				items={ [ { id: 1, title: 'Item' } ] }
				closeModal={ jest.fn() }
			/>
		);

		await waitFor( () => {
			expect( screen.getByRole( 'dialog' ) ).toBeVisible();
		} );
	} );

	it( 'renders with an alertdialog role when hideModalHeader is true', async () => {
		const action = createAction( { hideModalHeader: true } );

		render(
			<ActionModal
				action={ action }
				items={ [ { id: 1, title: 'Item' } ] }
				closeModal={ jest.fn() }
			/>
		);

		await waitFor( () => {
			expect( screen.getByRole( 'alertdialog' ) ).toBeVisible();
		} );
	} );

	it( "maps modalSize 'fill' to 'stretch' and emits a deprecation warning", async () => {
		const action = createAction( {
			modalSize: 'fill',
		} );

		render(
			<ActionModal
				action={ action }
				items={ [ { id: 1, title: 'Item' } ] }
				closeModal={ jest.fn() }
			/>
		);

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

		render(
			<ActionModal
				action={ action }
				items={ [ { id: 1, title: 'Item' } ] }
				closeModal={ jest.fn() }
			/>
		);

		await waitFor( () => {
			expect( screen.getByTestId( 'first-input' ) ).toHaveFocus();
		} );
	} );

	it( 'falls back to the popup smart default when modalFocusOnMount is unset', async () => {
		// With Base UI's smart default (and the close-icon de-prioritisation
		// installed by `Dialog.Popup`), focus should land on the first content
		// tabbable rather than the close button.
		const action = createAction( {
			RenderModal: () => (
				<div>
					<p>Some text</p>
					<button data-testid="content-button">Content button</button>
				</div>
			),
		} );

		render(
			<ActionModal
				action={ action }
				items={ [ { id: 1, title: 'Item' } ] }
				closeModal={ jest.fn() }
			/>
		);

		await waitFor( () => {
			expect( screen.getByTestId( 'content-button' ) ).toHaveFocus();
		} );
	} );

	it.each( [ 'small', 'medium', 'large', 'stretch', 'full' ] as const )(
		'forwards modalSize %p to Dialog.Popup without emitting a deprecation warning',
		async ( modalSize ) => {
			const action = createAction( { modalSize } );

			render(
				<ActionModal
					action={ action }
					items={ [ { id: 1, title: 'Item' } ] }
					closeModal={ jest.fn() }
				/>
			);

			await screen.findByRole( 'dialog' );
			expect( console ).not.toHaveWarned();
		}
	);

	it( 'renders the popup inside the dataviews-action-modal__portal element', async () => {
		const action = createAction();

		render(
			<ActionModal
				action={ action }
				items={ [ { id: 1, title: 'Item' } ] }
				closeModal={ jest.fn() }
			/>
		);

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
		const closeModal = jest.fn();
		const action = createAction();

		render(
			<ActionModal
				action={ action }
				items={ [ { id: 1, title: 'Item' } ] }
				closeModal={ closeModal }
			/>
		);

		await screen.findByRole( 'dialog' );
		await user.keyboard( '{Escape}' );

		expect( closeModal ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'closes when the user clicks the backdrop by default', async () => {
		const user = userEvent.setup();
		const closeModal = jest.fn();
		const action = createAction();

		render(
			<ActionModal
				action={ action }
				items={ [ { id: 1, title: 'Item' } ] }
				closeModal={ closeModal }
			/>
		);

		await screen.findByRole( 'dialog' );
		const backdrop = screen.getByTestId( 'dialog-backdrop' );
		await user.click( backdrop );

		expect( closeModal ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not close on backdrop click for alert dialogs (hideModalHeader)', async () => {
		const user = userEvent.setup();
		const closeModal = jest.fn();
		const action = createAction( { hideModalHeader: true } );

		render(
			<ActionModal
				action={ action }
				items={ [ { id: 1, title: 'Item' } ] }
				closeModal={ closeModal }
			/>
		);

		await screen.findByRole( 'alertdialog' );
		const backdrop = screen.getByTestId( 'dialog-backdrop' );
		await user.click( backdrop );

		expect( closeModal ).not.toHaveBeenCalled();
	} );
} );
