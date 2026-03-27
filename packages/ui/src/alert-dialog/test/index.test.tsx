import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';

import * as AlertDialog from '..';

describe( 'AlertDialog', () => {
	it( 'forwards ref', () => {
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();

		render(
			<AlertDialog.Root defaultOpen>
				<AlertDialog.Trigger ref={ triggerRef }>
					Open
				</AlertDialog.Trigger>
				<AlertDialog.Popup
					ref={ popupRef }
					title="Test Title"
					onConfirm={ jest.fn() }
				>
					Test message content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'renders with title, message, and default buttons', async () => {
		render(
			<AlertDialog.Root open onOpenChange={ jest.fn() }>
				<AlertDialog.Popup title="Test Title" onConfirm={ jest.fn() }>
					Test message content
				</AlertDialog.Popup>
			</AlertDialog.Root>
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

	it( 'renders with role="alertdialog" for default intent', async () => {
		render(
			<AlertDialog.Root open onOpenChange={ jest.fn() }>
				<AlertDialog.Popup
					title="Default Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByRole( 'alertdialog' ) ).toBeVisible();
		} );
	} );

	it( 'renders with role="alertdialog" for irreversible intent', async () => {
		render(
			<AlertDialog.Root
				intent="irreversible"
				open
				onOpenChange={ jest.fn() }
			>
				<AlertDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByRole( 'alertdialog' ) ).toBeVisible();
		} );
	} );

	it( 'calls onConfirm and onOpenChange when confirm button is clicked', async () => {
		const onConfirm = jest.fn();
		const onOpenChange = jest.fn();

		render(
			<AlertDialog.Root open onOpenChange={ onOpenChange }>
				<AlertDialog.Popup
					title="Confirm Action"
					onConfirm={ onConfirm }
				>
					Are you sure?
				</AlertDialog.Popup>
			</AlertDialog.Root>
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
			<AlertDialog.Root open onOpenChange={ onOpenChange }>
				<AlertDialog.Popup
					title="Confirm Action"
					onConfirm={ onConfirm }
				>
					Are you sure?
				</AlertDialog.Popup>
			</AlertDialog.Root>
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
			<AlertDialog.Root open onOpenChange={ onOpenChange }>
				<AlertDialog.Popup
					title="Default Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
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

	it( 'does not call onOpenChange on backdrop click for default intent', async () => {
		const onOpenChange = jest.fn();

		render(
			<AlertDialog.Root open onOpenChange={ onOpenChange }>
				<AlertDialog.Popup
					title="Default Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByText( 'Default Dialog' ) ).toBeVisible();
		} );

		await userEvent.click( document.body );

		expect( onOpenChange ).not.toHaveBeenCalled();
	} );

	it( 'renders with title, message, and default buttons for irreversible intent', async () => {
		render(
			<AlertDialog.Root
				intent="irreversible"
				open
				onOpenChange={ jest.fn() }
			>
				<AlertDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ jest.fn() }
				>
					Irreversible message content
				</AlertDialog.Popup>
			</AlertDialog.Root>
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

	it( 'calls onOpenChange on escape key for irreversible intent', async () => {
		const onOpenChange = jest.fn();

		render(
			<AlertDialog.Root
				intent="irreversible"
				open
				onOpenChange={ onOpenChange }
			>
				<AlertDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByText( 'Irreversible Dialog' ) ).toBeVisible();
		} );

		await userEvent.keyboard( '{Escape}' );

		expect( onOpenChange ).toHaveBeenCalledWith(
			false,
			expect.objectContaining( { reason: 'escape-key' } )
		);
	} );

	it( 'does not call onOpenChange on backdrop click for irreversible intent', async () => {
		const onOpenChange = jest.fn();

		render(
			<AlertDialog.Root
				intent="irreversible"
				open
				onOpenChange={ onOpenChange }
			>
				<AlertDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ jest.fn() }
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
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
			<AlertDialog.Root
				intent="irreversible"
				open
				onOpenChange={ onOpenChange }
			>
				<AlertDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ onConfirm }
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
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
			<AlertDialog.Root
				intent="irreversible"
				open
				onOpenChange={ onOpenChange }
			>
				<AlertDialog.Popup
					title="Irreversible Dialog"
					onConfirm={ onConfirm }
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
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
			<AlertDialog.Root open onOpenChange={ jest.fn() }>
				<AlertDialog.Popup
					title="Loading Test"
					onConfirm={ jest.fn() }
					loading
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
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
			<AlertDialog.Root open onOpenChange={ jest.fn() }>
				<AlertDialog.Popup
					title="No Loading"
					onConfirm={ jest.fn() }
					loading={ false }
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
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
			<AlertDialog.Root open onOpenChange={ jest.fn() }>
				<AlertDialog.Popup
					title="Custom Text"
					onConfirm={ jest.fn() }
					confirmButtonText="Yes, do it"
					cancelButtonText="No, go back"
				>
					Custom message
				</AlertDialog.Popup>
			</AlertDialog.Root>
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

	it( 'keeps dialog open when confirm is clicked with loading prop (async flow)', async () => {
		function AsyncDialog() {
			const [ isOpen, setIsOpen ] = useState( true );
			const [ isLoading, setIsLoading ] = useState( false );

			return (
				<AlertDialog.Root
					open={ isOpen }
					onOpenChange={ ( open ) => {
						if ( ! isLoading ) {
							setIsOpen( open );
						}
					} }
				>
					<AlertDialog.Popup
						title="Async Test"
						loading={ isLoading }
						onConfirm={ () => setIsLoading( true ) }
					>
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);
		}

		render( <AsyncDialog /> );

		await waitFor( () => {
			expect( screen.getByText( 'Async Test' ) ).toBeVisible();
		} );

		await userEvent.click( screen.getByRole( 'button', { name: 'OK' } ) );

		expect( screen.getByText( 'Async Test' ) ).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'OK' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'does not auto-close on confirm click when loading is false (manual-close mode)', async () => {
		function ManualCloseDialog() {
			const [ isOpen, setIsOpen ] = useState( true );

			return (
				<AlertDialog.Root
					open={ isOpen }
					onOpenChange={ ( open ) => setIsOpen( open ) }
				>
					<AlertDialog.Popup
						title="Manual Close"
						loading={ false }
						onConfirm={ jest.fn() }
					>
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);
		}

		render( <ManualCloseDialog /> );

		await waitFor( () => {
			expect( screen.getByText( 'Manual Close' ) ).toBeVisible();
		} );

		await userEvent.click( screen.getByRole( 'button', { name: 'OK' } ) );

		expect( screen.getByText( 'Manual Close' ) ).toBeVisible();
	} );

	it( 'opens dialog when Trigger is clicked', async () => {
		render(
			<AlertDialog.Root>
				<AlertDialog.Trigger>Open</AlertDialog.Trigger>
				<AlertDialog.Popup title="Trigger Test" onConfirm={ jest.fn() }>
					Dialog content
				</AlertDialog.Popup>
			</AlertDialog.Root>
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
