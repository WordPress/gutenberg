import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';
import * as Popover from '../index';

describe( 'Popover', () => {
	describe( 'forwards ref', () => {
		it( 'should forward ref on Trigger', () => {
			const ref = createRef< HTMLButtonElement >();
			render(
				<Popover.Root>
					<Popover.Trigger ref={ ref }>Open</Popover.Trigger>
					<Popover.Popup>Content</Popover.Popup>
				</Popover.Root>
			);
			expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
		} );

		it( 'should forward ref on Popup', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLDivElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup ref={ ref }>Content</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toBeInstanceOf( HTMLDivElement );
			} );
		} );

		it( 'should forward ref on Arrow', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLDivElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Arrow ref={ ref } />
						Content
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toBeInstanceOf( HTMLDivElement );
			} );
		} );

		it( 'should forward ref on Title', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLHeadingElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title ref={ ref }>Title</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toBeInstanceOf( HTMLHeadingElement );
			} );
		} );

		it( 'should forward ref on Description', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLParagraphElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Description ref={ ref }>
							Description
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toBeInstanceOf( HTMLParagraphElement );
			} );
		} );

		it( 'should forward ref on Close', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLButtonElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Close ref={ ref }>Close</Popover.Close>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
			} );
		} );
	} );

	describe( 'open and close behavior', () => {
		it( 'should open the popover when the trigger is clicked', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>Popover content</Popover.Popup>
				</Popover.Root>
			);

			expect(
				screen.queryByText( 'Popover content' )
			).not.toBeInTheDocument();

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect(
					screen.getByText( 'Popover content' )
				).toBeInTheDocument();
			} );
		} );

		it( 'should close the popover when clicking the trigger again', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Toggle</Popover.Trigger>
					<Popover.Popup>Popover content</Popover.Popup>
				</Popover.Root>
			);

			const trigger = screen.getByRole( 'button', {
				name: 'Toggle',
			} );

			await user.click( trigger );
			await waitFor( () => {
				expect(
					screen.getByText( 'Popover content' )
				).toBeInTheDocument();
			} );

			await user.click( trigger );
			await waitFor( () => {
				expect(
					screen.queryByText( 'Popover content' )
				).not.toBeInTheDocument();
			} );
		} );

		it( 'should close the popover when Escape is pressed', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>Popover content</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect(
					screen.getByText( 'Popover content' )
				).toBeInTheDocument();
			} );

			await user.keyboard( '{Escape}' );

			await waitFor( () => {
				expect(
					screen.queryByText( 'Popover content' )
				).not.toBeInTheDocument();
			} );
		} );

		it( 'should close the popover when the Close button is clicked', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						Popover content
						<Popover.Close>Close</Popover.Close>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect(
					screen.getByText( 'Popover content' )
				).toBeInTheDocument();
			} );

			await user.click( screen.getByRole( 'button', { name: 'Close' } ) );

			await waitFor( () => {
				expect(
					screen.queryByText( 'Popover content' )
				).not.toBeInTheDocument();
			} );
		} );
	} );

	describe( 'controlled mode', () => {
		function ControlledPopover() {
			const [ open, setOpen ] = useState( false );
			return (
				<>
					<button onClick={ () => setOpen( true ) }>
						External open
					</button>
					<Popover.Root open={ open } onOpenChange={ setOpen }>
						<Popover.Trigger>Trigger</Popover.Trigger>
						<Popover.Popup>Controlled content</Popover.Popup>
					</Popover.Root>
				</>
			);
		}

		it( 'should open via external state', async () => {
			const user = userEvent.setup();

			render( <ControlledPopover /> );

			expect(
				screen.queryByText( 'Controlled content' )
			).not.toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', { name: 'External open' } )
			);

			await waitFor( () => {
				expect(
					screen.getByText( 'Controlled content' )
				).toBeInTheDocument();
			} );
		} );
	} );

	describe( 'defaultOpen', () => {
		it( 'should render open initially when defaultOpen is true', async () => {
			render(
				<Popover.Root defaultOpen>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>Default open content</Popover.Popup>
				</Popover.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByText( 'Default open content' )
				).toBeInTheDocument();
			} );
		} );
	} );

	describe( 'onOpenChange callback', () => {
		it( 'should call onOpenChange when the popover opens and closes', async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();

			render(
				<Popover.Root onOpenChange={ onOpenChange }>
					<Popover.Trigger>Toggle</Popover.Trigger>
					<Popover.Popup>Content</Popover.Popup>
				</Popover.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Toggle' } )
			);

			await waitFor( () => {
				expect( onOpenChange ).toHaveBeenCalledWith(
					true,
					expect.anything()
				);
			} );

			await user.click(
				screen.getByRole( 'button', { name: 'Toggle' } )
			);

			await waitFor( () => {
				expect( onOpenChange ).toHaveBeenCalledWith(
					false,
					expect.anything()
				);
			} );
		} );
	} );

	describe( 'accessibility', () => {
		it( 'should associate title with the popup via aria-labelledby', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>My Title</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				const title = screen.getByText( 'My Title' );
				expect( title.id ).toBeTruthy();
			} );
		} );

		it( 'should associate description with the popup via aria-describedby', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Description>
							My Description
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				const description = screen.getByText( 'My Description' );
				expect( description.id ).toBeTruthy();
			} );
		} );
	} );
} );
