import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dropdown from '..';
import { DropdownContentWrapper } from '../dropdown-content-wrapper';
import styles from '../style.module.scss';

describe( 'DropdownContentWrapper', () => {
	it( 'should apply the small padding class by default', () => {
		render(
			<DropdownContentWrapper>
				<span>content</span>
			</DropdownContentWrapper>
		);

		// Disable reason: Semantic queries can't reach the wrapper.
		// eslint-disable-next-line testing-library/no-node-access
		expect( screen.getByText( 'content' ).parentElement ).toHaveClass(
			styles[ 'content-wrapper' ],
			styles[ 'padding-small' ]
		);
	} );

	it( 'should apply the medium padding class', () => {
		render(
			<DropdownContentWrapper paddingSize="medium">
				<span>content</span>
			</DropdownContentWrapper>
		);

		// Disable reason: Semantic queries can't reach the wrapper.
		// eslint-disable-next-line testing-library/no-node-access
		const wrapper = screen.getByText( 'content' ).parentElement;
		expect( wrapper ).toHaveClass(
			styles[ 'content-wrapper' ],
			styles[ 'padding-medium' ]
		);
		expect( wrapper ).not.toHaveClass( styles[ 'padding-small' ] );
	} );

	it( 'should omit padding classes when paddingSize is none', () => {
		render(
			<DropdownContentWrapper paddingSize="none">
				<span>content</span>
			</DropdownContentWrapper>
		);

		// Disable reason: Semantic queries can't reach the wrapper.
		// eslint-disable-next-line testing-library/no-node-access
		const wrapper = screen.getByText( 'content' ).parentElement;
		expect( wrapper ).toHaveClass( styles[ 'content-wrapper' ] );
		expect( wrapper ).not.toHaveClass( styles[ 'padding-small' ] );
		expect( wrapper ).not.toHaveClass( styles[ 'padding-medium' ] );
	} );
} );

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
