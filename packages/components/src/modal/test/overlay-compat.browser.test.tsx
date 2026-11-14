import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import '@wordpress/theme/design-tokens.css';
import { createPortal, useState } from '@wordpress/element';
import {
	Dialog,
	Popover as UIPopover,
	SelectControl,
	useEnableWpCompatOverlaySlot,
} from '@wordpress/ui';
import Modal from '../index';
import Dropdown from '../../dropdown';
import LegacyPopover from '../../popover';
import Button from '../../button';
import { Provider as SlotFillProvider } from '../../slot-fill';
import '../style.scss';
import '../../popover/style.scss';

function NestedModal() {
	const [ open, setOpen ] = useState( false );
	return (
		<>
			<Button __next40pxDefaultSize onClick={ () => setOpen( true ) }>
				Open nested modal
			</Button>
			{ open && (
				<Modal
					title="Nested child"
					onRequestClose={ () => setOpen( false ) }
				>
					<p>Nested modal content</p>
				</Modal>
			) }
		</>
	);
}

function LegacyFields( { initiallyOpen = false } ) {
	const [ modalOpen, setModalOpen ] = useState( initiallyOpen );
	return (
		<SlotFillProvider>
			<Dropdown
				renderToggle={ ( { onToggle } ) => (
					<Button __next40pxDefaultSize onClick={ onToggle }>
						Open legacy dropdown
					</Button>
				) }
				renderContent={ ( { onClose } ) => (
					<Button __next40pxDefaultSize onClick={ onClose }>
						Choose legacy option
					</Button>
				) }
			/>
			<Button
				__next40pxDefaultSize
				onClick={ () => setModalOpen( true ) }
			>
				Open legacy modal
			</Button>
			{ modalOpen && (
				<Modal
					title="Legacy child"
					onRequestClose={ () => setModalOpen( false ) }
				>
					<SelectControl
						label="Child selection"
						items={ [
							{ label: 'First option', value: 'first' },
							{ label: 'Second option', value: 'second' },
						] }
					/>
					<NestedModal />
				</Modal>
			) }
		</SlotFillProvider>
	);
}

function MixedOverlays( { initiallyOpen = false } ) {
	useEnableWpCompatOverlaySlot();
	return (
		<Dialog.Root defaultOpen={ initiallyOpen }>
			<Dialog.Trigger>Open host</Dialog.Trigger>
			<Dialog.Popup>
				<Dialog.Title>Host dialog</Dialog.Title>
				<Dialog.CloseIconButton />
				<UIPopover.Root defaultOpen={ initiallyOpen }>
					<UIPopover.Trigger>Open field</UIPopover.Trigger>
					<UIPopover.Popup>
						<UIPopover.Title>Field editor</UIPopover.Title>
						<LegacyFields initiallyOpen={ initiallyOpen } />
						<UIPopover.Close>Close field</UIPopover.Close>
					</UIPopover.Popup>
				</UIPopover.Root>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function LegacyHost() {
	const [ open, setOpen ] = useState( false );
	return (
		<>
			<Button __next40pxDefaultSize onClick={ () => setOpen( true ) }>
				Open legacy host
			</Button>
			{ open && (
				<Modal
					title="Legacy host"
					onRequestClose={ () => setOpen( false ) }
				>
					<Dropdown
						renderToggle={ ( { onToggle } ) => (
							<Button __next40pxDefaultSize onClick={ onToggle }>
								Open legacy field
							</Button>
						) }
						renderContent={ () => <LegacyFields /> }
					/>
				</Modal>
			) }
		</>
	);
}

function RegisteredSlotHost( {
	slotName,
	scoped = false,
	nested = false,
}: {
	slotName?: string;
	scoped?: boolean;
	nested?: boolean;
} ) {
	useEnableWpCompatOverlaySlot();
	const scopedSlotName = scoped ? 'scoped' : undefined;
	const nestedSlotName = nested ? 'nested' : scopedSlotName;
	return (
		<SlotFillProvider>
			<section aria-label="Default popover slot">
				<LegacyPopover.Slot />
			</section>
			<section aria-label="Named popover slot">
				<LegacyPopover.Slot name="named" />
			</section>
			<UIPopover.Root defaultOpen>
				<UIPopover.Popup>
					<UIPopover.Title>Slot host</UIPopover.Title>
					<LegacyPopover.__unstableSlotNameProvider
						value={ scopedSlotName }
					>
						<LegacyPopover.__unstableSlotNameProvider
							value={ nestedSlotName }
						>
							<LegacyPopover
								__unstableSlotName={ slotName }
								focusOnMount={ false }
							>
								Explicitly placed content
							</LegacyPopover>
						</LegacyPopover.__unstableSlotNameProvider>
					</LegacyPopover.__unstableSlotNameProvider>
					<section aria-label="Scoped popover slot">
						<LegacyPopover.Slot name="scoped" />
					</section>
					<section aria-label="Nested popover slot">
						<LegacyPopover.Slot name="nested" />
					</section>
					<UIPopover.Close>Close slot host</UIPopover.Close>
				</UIPopover.Popup>
			</UIPopover.Root>
		</SlotFillProvider>
	);
}

describe( 'Mixed overlay compatibility', () => {
	afterEach( () => vi.unstubAllGlobals() );

	it( 'preserves registered popover slots and explicit names inside scoped providers', async () => {
		for ( const { props, destination } of [
			{ props: {}, destination: 'Default' },
			{ props: { scoped: true }, destination: 'Scoped' },
			{ props: { scoped: true, nested: true }, destination: 'Nested' },
			{
				props: { scoped: true, nested: true, slotName: 'named' },
				destination: 'Named',
			},
			{
				props: { scoped: true, slotName: 'Popover' },
				destination: 'Default',
			},
		] ) {
			const { unmount } = await render(
				<RegisteredSlotHost { ...props } />
			);
			expect(
				within(
					screen.getByRole( 'region', {
						name: `${ destination } popover slot`,
					} )
				).getByText( 'Explicitly placed content' )
			).toBeInTheDocument();
			await unmount();
		}
	} );

	it( 'restores a legacy field flyout after its child modal closes', async () => {
		await render( <LegacyHost /> );
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open legacy host' } )
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open legacy field' } )
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open legacy modal' } )
		);
		const child = screen.getByRole( 'dialog', { name: 'Legacy child' } );
		await userEvent.keyboard( '{Escape}' );
		await expect.element( child ).not.toBeInTheDocument();
		await expect
			.element(
				screen.getByRole( 'button', { name: 'Open legacy modal' } )
			)
			.toHaveFocus();
		expect(
			screen.getByRole( 'dialog', { name: 'Legacy host' } )
		).toBeVisible();
	} );

	it( 'opens a legacy modal without requiring focus on its opening control', async () => {
		await render( <MixedOverlays initiallyOpen /> );
		const modal = screen.getByRole( 'dialog', { name: 'Legacy child' } );
		await userEvent.click(
			within( modal ).getByRole( 'combobox', { name: 'Child selection' } )
		);
		await userEvent.click(
			screen.getByRole( 'option', { name: 'Second option' } )
		);
		expect(
			within( modal ).getByRole( 'combobox', { name: 'Child selection' } )
		).toHaveTextContent( 'Second option' );
	} );

	it( 'restores the preceding modal when a nested legacy modal closes', async () => {
		await render( <MixedOverlays /> );
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open host' } )
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open field' } )
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open legacy modal' } )
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open nested modal' } )
		);
		expect(
			screen.queryByRole( 'dialog', { name: 'Legacy child' } )
		).not.toBeInTheDocument();
		const child = screen.getByRole( 'dialog', { name: 'Nested child' } );
		await expect.element( child ).toBeVisible();
		await userEvent.keyboard( '{Escape}' );
		await expect.element( child ).not.toBeInTheDocument();
		await expect
			.element(
				screen.getByRole( 'button', { name: 'Open nested modal' } )
			)
			.toHaveFocus();
		expect(
			screen.getByRole( 'dialog', { name: 'Legacy child' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'dialog', { name: 'Host dialog' } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps an isolated legacy dropdown usable inside a UI popover', async () => {
		await render( <MixedOverlays /> );
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open host' } )
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open field' } )
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open legacy dropdown' } )
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Choose legacy option' } )
		);
		expect(
			screen.getByRole( 'dialog', { name: 'Field editor' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Open legacy dropdown' } )
		).toHaveFocus();
	} );

	it( 'keeps a legacy modal and its UI select usable above the parent overlays', async () => {
		await render( <MixedOverlays /> );
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open host' } )
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open field' } )
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open legacy modal' } )
		);
		const modal = screen.getByRole( 'dialog', { name: 'Legacy child' } );
		expect(
			screen.queryByRole( 'dialog', { name: 'Field editor' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'dialog', { name: 'Host dialog' } )
		).not.toBeInTheDocument();
		await userEvent.click(
			within( modal ).getByRole( 'combobox', { name: 'Child selection' } )
		);
		await userEvent.click(
			screen.getByRole( 'option', { name: 'Second option' } )
		);
		await userEvent.keyboard( '{Escape}' );
		await expect.element( modal ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'dialog', { name: 'Field editor' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Open legacy modal' } )
		).toHaveFocus();
	} );
} );

it.each( [ 'native', 'legacy' ] )(
	'keeps %s portal source nodes out of editable content',
	async ( implementation ) => {
		function Editable() {
			const [ editor, setEditor ] = useState< HTMLDivElement | null >(
				null
			);
			return (
				<div
					ref={ setEditor }
					contentEditable
					suppressContentEditableWarning
				>
					Editable text
					{ editor &&
						( implementation === 'native' ? (
							<Dialog.Root defaultOpen>
								<Dialog.Popup>
									<Dialog.Title>Editor popup</Dialog.Title>
									<button>Option</button>
								</Dialog.Popup>
							</Dialog.Root>
						) : (
							<LegacyPopover anchor={ editor }>
								<button>Option</button>
							</LegacyPopover>
						) ) }
				</div>
			);
		}
		await render( <Editable /> );
		await expect
			.element( screen.getByRole( 'button', { name: 'Option' } ) )
			.toBeVisible();
		// Rich text serializes this DOM, including otherwise hidden placeholder nodes.
		expect( screen.getByText( 'Editable text' ).innerHTML ).toBe(
			'Editable text'
		);
	}
);

it( 'opens a portal when its source is not attached to the document yet', async () => {
	const container = document.createElement( 'div' );
	await render(
		createPortal(
			<Dialog.Root defaultOpen>
				<Dialog.Popup>
					<Dialog.Title>Detached source</Dialog.Title>
					<button>Detached option</button>
				</Dialog.Popup>
			</Dialog.Root>,
			container
		)
	);
	await expect
		.element( screen.getByRole( 'button', { name: 'Detached option' } ) )
		.toBeVisible();
} );
