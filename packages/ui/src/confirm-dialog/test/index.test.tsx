import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';

import * as ConfirmDialog from '..';

describe( 'ConfirmDialog', () => {
	it( 'forwards ref', () => {
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();

		render(
			<ConfirmDialog.Root defaultOpen>
				<ConfirmDialog.Trigger ref={ triggerRef }>
					Open
				</ConfirmDialog.Trigger>
				<ConfirmDialog.Popup
					ref={ popupRef }
					title="Test Title"
					onConfirm={ jest.fn() }
				>
					Test message content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'renders with title, message, and default buttons', async () => {
		render(
			<ConfirmDialog.Root open onOpenChange={ jest.fn() }>
				<ConfirmDialog.Popup title="Test Title" onConfirm={ jest.fn() }>
					Test message content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByText( 'Test Title' ) ).toBeVisible();
		} );

		expect( screen.getByText( 'Test message content' ) ).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Close' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'OK' } ) ).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Cancel' } )
		).toBeVisible();
	} );

	it( 'renders with role="dialog" for default intent', async () => {
		render(
			<ConfirmDialog.Root open onOpenChange={ jest.fn() }>
				<ConfirmDialog.Popup
					title="Default Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByRole( 'dialog' ) ).toBeVisible();
		} );
	} );

	it( 'renders with role="alertdialog" for irreversible intent', async () => {
		render(
			<ConfirmDialog.Root
				intent="irreversible"
				open
				onOpenChange={ jest.fn() }
			>
				<ConfirmDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByRole( 'alertdialog' ) ).toBeVisible();
		} );
	} );

	it( 'calls onConfirm and onOpenChange when confirm button is clicked', async () => {
		const onConfirm = jest.fn();
		const onOpenChange = jest.fn();

		render(
			<ConfirmDialog.Root open onOpenChange={ onOpenChange }>
				<ConfirmDialog.Popup
					title="Confirm Action"
					onConfirm={ onConfirm }
				>
					Are you sure?
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', { name: 'OK' } )
			).toBeVisible();
		} );

		await userEvent.click( screen.getByRole( 'button', { name: 'OK' } ) );

		expect( onConfirm ).toHaveBeenCalledTimes( 1 );
		expect( onOpenChange ).toHaveBeenCalledWith(
			false,
			expect.objectContaining( { reason: 'close-press' } )
		);
	} );

	it( 'calls onOpenChange when cancel button is clicked', async () => {
		const onConfirm = jest.fn();
		const onOpenChange = jest.fn();

		render(
			<ConfirmDialog.Root open onOpenChange={ onOpenChange }>
				<ConfirmDialog.Popup
					title="Confirm Action"
					onConfirm={ onConfirm }
				>
					Are you sure?
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', { name: 'Cancel' } )
			).toBeVisible();
		} );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Cancel' } )
		);

		expect( onOpenChange ).toHaveBeenCalledWith(
			false,
			expect.objectContaining( { reason: 'close-press' } )
		);
		expect( onConfirm ).not.toHaveBeenCalled();
	} );

	it( 'calls onOpenChange on escape key for default intent', async () => {
		const onOpenChange = jest.fn();

		render(
			<ConfirmDialog.Root open onOpenChange={ onOpenChange }>
				<ConfirmDialog.Popup
					title="Default Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByText( 'Default Dialog' ) ).toBeVisible();
		} );

		await userEvent.keyboard( '{Escape}' );

		expect( onOpenChange ).toHaveBeenCalledWith(
			false,
			expect.objectContaining( { reason: 'escape-key' } )
		);
	} );

	it( 'calls onOpenChange on backdrop click for default intent', async () => {
		const onOpenChange = jest.fn();

		render(
			<ConfirmDialog.Root open onOpenChange={ onOpenChange }>
				<ConfirmDialog.Popup
					title="Default Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByText( 'Default Dialog' ) ).toBeVisible();
		} );

		await userEvent.click( document.body );

		expect( onOpenChange ).toHaveBeenCalledWith(
			false,
			expect.objectContaining( { reason: 'outside-press' } )
		);
	} );

	it( 'renders with title, message, and default buttons for irreversible intent', async () => {
		render(
			<ConfirmDialog.Root
				intent="irreversible"
				open
				onOpenChange={ jest.fn() }
			>
				<ConfirmDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ jest.fn() }
				>
					Irreversible message content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByText( 'Irreversible Dialog' ) ).toBeVisible();
		} );

		expect(
			screen.getByText( 'Irreversible message content' )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Close' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'OK' } ) ).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Cancel' } )
		).toBeVisible();
	} );

	it( 'does not call onOpenChange on escape key for irreversible intent', async () => {
		const onOpenChange = jest.fn();

		render(
			<ConfirmDialog.Root
				intent="irreversible"
				open
				onOpenChange={ onOpenChange }
			>
				<ConfirmDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByText( 'Irreversible Dialog' ) ).toBeVisible();
		} );

		await userEvent.keyboard( '{Escape}' );

		expect( onOpenChange ).not.toHaveBeenCalled();
	} );

	it( 'does not call onOpenChange on backdrop click for irreversible intent', async () => {
		const onOpenChange = jest.fn();

		render(
			<ConfirmDialog.Root
				intent="irreversible"
				open
				onOpenChange={ onOpenChange }
			>
				<ConfirmDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByText( 'Irreversible Dialog' ) ).toBeVisible();
		} );

		await userEvent.click( document.body );

		expect( onOpenChange ).not.toHaveBeenCalled();
	} );

	it( 'calls onOpenChange on cancel button click for irreversible intent', async () => {
		const onOpenChange = jest.fn();
		const onConfirm = jest.fn();

		render(
			<ConfirmDialog.Root
				intent="irreversible"
				open
				onOpenChange={ onOpenChange }
			>
				<ConfirmDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ onConfirm }
				>
					Content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', { name: 'Cancel' } )
			).toBeVisible();
		} );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Cancel' } )
		);

		expect( onOpenChange ).toHaveBeenCalledWith(
			false,
			expect.objectContaining( { reason: 'close-press' } )
		);
		expect( onConfirm ).not.toHaveBeenCalled();
	} );

	it( 'calls onConfirm and onOpenChange on confirm button click for irreversible intent', async () => {
		const onOpenChange = jest.fn();
		const onConfirm = jest.fn();

		render(
			<ConfirmDialog.Root
				intent="irreversible"
				open
				onOpenChange={ onOpenChange }
			>
				<ConfirmDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ onConfirm }
				>
					Content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', { name: 'OK' } )
			).toBeVisible();
		} );

		await userEvent.click( screen.getByRole( 'button', { name: 'OK' } ) );

		expect( onConfirm ).toHaveBeenCalledTimes( 1 );
		expect( onOpenChange ).toHaveBeenCalledWith(
			false,
			expect.objectContaining( { reason: 'close-press' } )
		);
	} );

	it( 'disables both buttons when loading', async () => {
		render(
			<ConfirmDialog.Root open onOpenChange={ jest.fn() }>
				<ConfirmDialog.Popup
					title="Loading Test"
					onConfirm={ jest.fn() }
					loading
				>
					Content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', { name: 'OK' } )
			).toBeVisible();
		} );

		expect( screen.getByRole( 'button', { name: 'OK' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		expect(
			screen.getByRole( 'button', { name: 'Cancel' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'does not disable buttons when loading is false', async () => {
		render(
			<ConfirmDialog.Root open onOpenChange={ jest.fn() }>
				<ConfirmDialog.Popup
					title="No Loading"
					onConfirm={ jest.fn() }
					loading={ false }
				>
					Content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', { name: 'OK' } )
			).toBeVisible();
		} );

		expect(
			screen.getByRole( 'button', { name: 'OK' } )
		).not.toHaveAttribute( 'aria-disabled', 'true' );

		expect(
			screen.getByRole( 'button', { name: 'Cancel' } )
		).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'uses custom button text when provided', async () => {
		render(
			<ConfirmDialog.Root open onOpenChange={ jest.fn() }>
				<ConfirmDialog.Popup
					title="Custom Text"
					onConfirm={ jest.fn() }
					confirmButtonText="Yes, do it"
					cancelButtonText="No, go back"
				>
					Custom message
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', { name: 'Yes, do it' } )
			).toBeVisible();
		} );

		expect(
			screen.getByRole( 'button', { name: 'No, go back' } )
		).toBeVisible();
	} );

	it( 'opens dialog when Trigger is clicked', async () => {
		render(
			<ConfirmDialog.Root>
				<ConfirmDialog.Trigger>Open</ConfirmDialog.Trigger>
				<ConfirmDialog.Popup
					title="Trigger Test"
					onConfirm={ jest.fn() }
				>
					Dialog content
				</ConfirmDialog.Popup>
			</ConfirmDialog.Root>
		);

		expect(
			screen.queryByText( 'Dialog content' )
		).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Open' } ) );

		await waitFor( () => {
			expect( screen.getByText( 'Trigger Test' ) ).toBeVisible();
		} );

		expect( screen.getByText( 'Dialog content' ) ).toBeVisible();
	} );
} );
