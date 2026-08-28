import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import Dropdown from '..';
import Modal from '../../modal';
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
		const wrapper = screen.getByText( 'content' ).parentElement;

		expect( wrapper ).toHaveClass( styles[ 'content-wrapper' ] );
		expect( wrapper ).toHaveClass( styles[ 'padding-small' ] );
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

		expect( wrapper ).toHaveClass( styles[ 'content-wrapper' ] );
		expect( wrapper ).toHaveClass( styles[ 'padding-medium' ] );
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

	it( 'should close the dropdown when focus moves into an unrelated dialog', async () => {
		const user = userEvent.setup();
		const TestComponent = () => {
			const [ isDialogOpen, setIsDialogOpen ] = useState( false );
			return (
				<div>
					<Dropdown
						renderToggle={ ( { isOpen, onToggle } ) => (
							<button
								aria-expanded={ isOpen }
								onClick={ onToggle }
							>
								Toggle Dropdown
							</button>
						) }
						renderContent={ () => <button>Dropdown Item</button> }
					/>
					<button onClick={ () => setIsDialogOpen( true ) }>
						Open External Dialog
					</button>
					{ isDialogOpen && (
						<Modal
							title="External Dialog"
							onRequestClose={ () => setIsDialogOpen( false ) }
						>
							<button>Inside Dialog</button>
						</Modal>
					) }
				</div>
			);
		};

		render( <TestComponent /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Toggle Dropdown' } )
		);
		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: 'Dropdown Item' } )
			).toBeVisible()
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Dropdown Item' } )
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Open External Dialog' } )
		);

		await waitFor( () =>
			expect(
				screen.queryByRole( 'button', {
					name: 'Dropdown Item',
					includeHidden: true,
				} )
			).not.toBeInTheDocument()
		);
	} );

	it( 'should keep the dropdown open when a dialog is opened from inside the dropdown', async () => {
		const user = userEvent.setup();
		const TestComponent = () => {
			const [ isDialogOpen, setIsDialogOpen ] = useState( false );
			return (
				<div>
					<Dropdown
						renderToggle={ ( { isOpen, onToggle } ) => (
							<button
								aria-expanded={ isOpen }
								onClick={ onToggle }
							>
								Toggle Dropdown
							</button>
						) }
						renderContent={ () => (
							<div>
								<button
									onClick={ () => setIsDialogOpen( true ) }
								>
									Open Dialog From Dropdown
								</button>
							</div>
						) }
					/>
					{ isDialogOpen && (
						<Modal
							title="Dropdown Dialog"
							onRequestClose={ () => setIsDialogOpen( false ) }
						>
							<button>Inside Dialog</button>
						</Modal>
					) }
				</div>
			);
		};

		render( <TestComponent /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Toggle Dropdown' } )
		);
		await waitFor( () =>
			expect(
				screen.getByRole( 'button', {
					name: 'Open Dialog From Dropdown',
				} )
			).toBeVisible()
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open Dialog From Dropdown' } )
		);

		await waitFor( () =>
			expect( screen.getByRole( 'dialog' ) ).toBeVisible()
		);

		expect(
			screen.getByText( 'Open Dialog From Dropdown' )
		).toBeInTheDocument();
	} );
} );
