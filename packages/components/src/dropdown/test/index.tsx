/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Dropdown from '..';

describe( 'Dropdown', () => {
	it( 'should toggle the dropdown properly', async () => {
		const user = userEvent.setup();
		const { unmount } = render(
			<Dropdown
				className="container"
				contentClassName="content"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button aria-expanded={ isOpen } onClick={ onToggle }>
						Toggle
					</button>
				) }
				renderContent={ () => <span>test</span> }
			/>
		);

		const button = screen.getByRole( 'button', { expanded: false } );

		expect( button ).toBeVisible();
		expect( screen.queryByText( 'test' ) ).not.toBeInTheDocument();

		await user.click( button );

		expect(
			screen.getByRole( 'button', { expanded: true } )
		).toBeVisible();

		await waitFor( () =>
			expect( screen.queryByText( 'test' ) ).toBeVisible()
		);

		// Cleanup remaining effects, like the delayed popover positioning
		unmount();
	} );

	it( 'should close the dropdown when calling onClose', async () => {
		const user = userEvent.setup();
		render(
			<Dropdown
				className="container"
				contentClassName="content"
				renderToggle={ ( { isOpen, onToggle, onClose } ) => [
					<button
						key="open"
						className="open"
						aria-expanded={ isOpen }
						onClick={ onToggle }
					>
						Toggle
					</button>,
					<button key="close" className="close" onClick={ onClose }>
						close
					</button>,
				] }
				renderContent={ () => <span>test</span> }
			/>
		);

		expect( screen.queryByText( 'test' ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Toggle' } ) );

		await waitFor( () =>
			expect( screen.getByText( 'test' ) ).toBeVisible()
		);

		await user.click( screen.getByRole( 'button', { name: 'close' } ) );

		expect( screen.queryByText( 'test' ) ).not.toBeInTheDocument();
	} );
} );
