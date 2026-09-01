import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createPortal, useState } from '@wordpress/element';
import Dropdown from '..';
import Modal from '../../modal';
import { DropdownContentWrapper } from '../dropdown-content-wrapper';
import styles from '../style.module.scss';

const DropdownWithModal = ( {
	dialogTriggerLocation,
	onClose,
	stopDialogTriggerPropagation = false,
}: {
	dialogTriggerLocation: 'inside' | 'outside';
	onClose?: () => void;
	stopDialogTriggerPropagation?: boolean;
} ) => {
	const [ isDialogOpen, setIsDialogOpen ] = useState( false );
	const dialogTrigger = (
		<button
			onClick={ ( event ) => {
				if ( stopDialogTriggerPropagation ) {
					event.stopPropagation();
				}
				setIsDialogOpen( true );
			} }
		>
			Open dialog
		</button>
	);

	return (
		<>
			<Dropdown
				onClose={ onClose }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button aria-expanded={ isOpen } onClick={ onToggle }>
						Toggle
					</button>
				) }
				renderContent={ () => (
					<>
						<button>Dropdown item</button>
						{ dialogTriggerLocation === 'inside' && dialogTrigger }
					</>
				) }
			/>
			{ dialogTriggerLocation === 'outside' && dialogTrigger }
			{ isDialogOpen && (
				<Modal
					title="Dialog"
					onRequestClose={ () => setIsDialogOpen( false ) }
				>
					<p>Dialog content</p>
				</Modal>
			) }
		</>
	);
};

const DropdownWithProgrammaticModal = ( {
	isDialogOpen,
	onClose,
}: {
	isDialogOpen: boolean;
	onClose: () => void;
} ) => (
	<>
		<Dropdown
			onClose={ onClose }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<button aria-expanded={ isOpen } onClick={ onToggle }>
					Toggle
				</button>
			) }
			renderContent={ () => <button>Dropdown item</button> }
		/>
		{ isDialogOpen && (
			<Modal
				title="Programmatic dialog"
				onRequestClose={ () => undefined }
			>
				<p>Programmatic dialog content</p>
			</Modal>
		) }
	</>
);

const DropdownWithPortaledModalTrigger = ( {
	portalContainer,
	onClose,
}: {
	portalContainer: Element;
	onClose: () => void;
} ) => {
	const [ isDialogOpen, setIsDialogOpen ] = useState( false );

	return (
		<>
			<Dropdown
				onClose={ onClose }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button aria-expanded={ isOpen } onClick={ onToggle }>
						Toggle
					</button>
				) }
				renderContent={ () =>
					createPortal(
						<button onClick={ () => setIsDialogOpen( true ) }>
							Open portaled dialog
						</button>,
						portalContainer
					)
				}
			/>
			{ isDialogOpen && (
				<Modal
					title="Portaled dialog"
					onRequestClose={ () => setIsDialogOpen( false ) }
				>
					<p>Portaled dialog content</p>
				</Modal>
			) }
		</>
	);
};

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

	it( 'should close when a dialog opens after an outside activation', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		render(
			<DropdownWithModal
				dialogTriggerLocation="outside"
				onClose={ onClose }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Toggle' } ) );
		await screen.findByRole( 'button', { name: 'Dropdown item' } );
		await user.click(
			screen.getByRole( 'button', { name: 'Open dialog' } )
		);

		await waitFor( () => expect( onClose ).toHaveBeenCalledTimes( 1 ) );
		expect( screen.queryByText( 'Dropdown item' ) ).not.toBeInTheDocument();
	} );

	it( 'should stay open and restore focus when its dialog closes', async () => {
		const user = userEvent.setup();
		render( <DropdownWithModal dialogTriggerLocation="inside" /> );

		await user.click( screen.getByRole( 'button', { name: 'Toggle' } ) );
		const dialogTrigger = await screen.findByRole( 'button', {
			name: 'Open dialog',
		} );
		await user.click( dialogTrigger );

		await screen.findByRole( 'dialog' );
		expect( screen.getByText( 'Dropdown item' ) ).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Close' } ) );

		await waitFor( () =>
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument()
		);
		expect( dialogTrigger ).toHaveFocus();
		expect( screen.getByText( 'Dropdown item' ) ).toBeInTheDocument();
	} );

	it( 'should stay open when a propagation-stopping trigger opens its dialog', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		render(
			<DropdownWithModal
				dialogTriggerLocation="inside"
				onClose={ onClose }
				stopDialogTriggerPropagation
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Toggle' } ) );
		const dialogTrigger = await screen.findByRole( 'button', {
			name: 'Open dialog',
		} );
		await user.click( dialogTrigger );

		await screen.findByRole( 'dialog', { name: 'Dialog' } );
		await waitFor( () => expect( onClose ).not.toHaveBeenCalled() );
		expect(
			screen.getByRole( 'button', { name: 'Toggle', hidden: true } )
		).toHaveAttribute( 'aria-expanded', 'true' );
	} );

	it( 'should stay open when a portaled trigger opens its dialog from another document', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		const iframe = document.createElement( 'iframe' );
		document.body.appendChild( iframe );
		let unmount: () => void = () => undefined;

		try {
			( { unmount } = render(
				<DropdownWithPortaledModalTrigger
					portalContainer={ iframe.contentDocument!.body }
					onClose={ onClose }
				/>
			) );
			await user.click(
				screen.getByRole( 'button', { name: 'Toggle' } )
			);
			await user.click(
				within( iframe.contentDocument!.body ).getByRole( 'button', {
					name: 'Open portaled dialog',
				} )
			);

			await screen.findByRole( 'dialog', { name: 'Portaled dialog' } );
			await waitFor( () => expect( onClose ).not.toHaveBeenCalled() );
			expect(
				screen.getByRole( 'button', {
					name: 'Toggle',
					hidden: true,
				} )
			).toHaveAttribute( 'aria-expanded', 'true' );
		} finally {
			unmount();
			iframe.remove();
		}
	} );

	it( 'should stay open when an iframe dropdown opens a dialog in the parent document', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		const iframe = document.createElement( 'iframe' );
		document.body.appendChild( iframe );
		const mountNode = iframe.contentDocument!.createElement( 'div' );
		iframe.contentDocument!.body.appendChild( mountNode );
		let unmount: () => void = () => undefined;

		try {
			( { unmount } = render(
				<DropdownWithModal
					dialogTriggerLocation="inside"
					onClose={ onClose }
				/>,
				{ container: mountNode }
			) );
			await user.click(
				within( iframe.contentDocument!.body ).getByRole( 'button', {
					name: 'Toggle',
				} )
			);
			await user.click(
				await screen.findByRole( 'button', {
					name: 'Open dialog',
				} )
			);

			await screen.findByRole( 'dialog', { name: 'Dialog' } );
			await waitFor( () => expect( onClose ).not.toHaveBeenCalled() );
			expect(
				within( iframe.contentDocument!.body ).getByRole( 'button', {
					name: 'Toggle',
					hidden: true,
				} )
			).toHaveAttribute( 'aria-expanded', 'true' );
		} finally {
			unmount();
			iframe.remove();
		}
	} );

	it( 'should not reuse a stale internal activation for an unrelated dialog', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		const { rerender } = render(
			<DropdownWithProgrammaticModal
				isDialogOpen={ false }
				onClose={ onClose }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Toggle' } ) );
		await user.click(
			await screen.findByRole( 'button', { name: 'Dropdown item' } )
		);
		rerender(
			<DropdownWithProgrammaticModal isDialogOpen onClose={ onClose } />
		);

		await screen.findByRole( 'dialog', { name: 'Programmatic dialog' } );
		await waitFor( () => expect( onClose ).toHaveBeenCalledTimes( 1 ) );
		expect( screen.queryByText( 'Dropdown item' ) ).not.toBeInTheDocument();
	} );

	it( 'should close when an iframe activation opens an unrelated dialog', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		const { rerender } = render(
			<DropdownWithProgrammaticModal
				isDialogOpen={ false }
				onClose={ onClose }
			/>
		);
		const iframe = document.createElement( 'iframe' );
		document.body.appendChild( iframe );

		try {
			await user.click(
				screen.getByRole( 'button', { name: 'Toggle' } )
			);
			await user.click(
				await screen.findByRole( 'button', { name: 'Dropdown item' } )
			);

			const iframeButton =
				iframe.contentDocument!.createElement( 'button' );
			iframeButton.addEventListener( 'click', () => {
				rerender(
					<DropdownWithProgrammaticModal
						isDialogOpen
						onClose={ onClose }
					/>
				);
			} );
			iframe.contentDocument!.body.appendChild( iframeButton );
			fireEvent.click( iframeButton );

			await screen.findByRole( 'dialog', {
				name: 'Programmatic dialog',
			} );
			await waitFor( () => expect( onClose ).toHaveBeenCalledTimes( 1 ) );
			expect(
				screen.queryByText( 'Dropdown item' )
			).not.toBeInTheDocument();
		} finally {
			iframe.remove();
		}
	} );

	it( 'should close when focus moves into an unrelated dialog', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		render(
			<>
				<div role="dialog" aria-label="Existing dialog">
					<button>Existing dialog item</button>
				</div>
				<Dropdown
					onClose={ onClose }
					popoverProps={ { constrainTabbing: false } }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<button aria-expanded={ isOpen } onClick={ onToggle }>
							Toggle
						</button>
					) }
					renderContent={ () => <button>Dropdown item</button> }
				/>
			</>
		);

		await user.click( screen.getByRole( 'button', { name: 'Toggle' } ) );
		const dropdownItem = await screen.findByRole( 'button', {
			name: 'Dropdown item',
		} );
		dropdownItem.focus();
		expect( dropdownItem ).toHaveFocus();
		fireEvent.keyDown( dropdownItem, { key: 'Tab' } );
		const existingDialogItem = screen.getByRole( 'button', {
			name: 'Existing dialog item',
		} );
		existingDialogItem.focus();

		expect( existingDialogItem ).toHaveFocus();
		await waitFor( () => expect( onClose ).toHaveBeenCalledTimes( 1 ) );
		expect( screen.queryByText( 'Dropdown item' ) ).not.toBeInTheDocument();
	} );
} );
