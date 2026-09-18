import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import InspectorControlsTabs from '../';
import { TAB_CONTENT, TAB_LIST_VIEW } from '../utils';
import { BlockEditorProvider } from '../../provider';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

// The inspector renders `@wordpress/components` layout primitives, which
// measure themselves on mount.
globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();
globalThis.wpVitest.mockPointerEvent();

// A section block standing in for a pattern: two content items, one of which
// (LIST_PARENT) has list-view support and children, and one of which
// (PLAIN) does not. This mirrors the Buttons/Heading shape the inspector
// tab coordination was written against.
const SECTION = 'test/section';
const LIST_PARENT = 'test/list-parent';
const LIST_CHILD = 'test/list-child';
const PLAIN = 'test/plain';

function CaptureRegistry( { onRegistry } ) {
	onRegistry( useRegistry() );
	return null;
}

describe( 'InspectorControlsTabs', () => {
	beforeAll( () => {
		registerBlockType( SECTION, {
			apiVersion: 3,
			title: 'Section',
			category: 'design',
			save: () => null,
		} );
		registerBlockType( LIST_PARENT, {
			apiVersion: 3,
			title: 'List Parent',
			category: 'design',
			save: () => null,
			supports: { listView: true },
		} );
		registerBlockType( LIST_CHILD, {
			apiVersion: 3,
			title: 'List Child',
			category: 'text',
			save: () => null,
		} );
		registerBlockType( PLAIN, {
			apiVersion: 3,
			title: 'Plain',
			category: 'text',
			save: () => null,
		} );
	} );

	afterAll( () => {
		[ SECTION, LIST_PARENT, LIST_CHILD, PLAIN ].forEach(
			unregisterBlockType
		);
	} );

	let registry;
	let blocks;

	// Rebuilt per test so client IDs and store state never leak between them.
	async function setup( { isSectionBlock = true } = {} ) {
		const child = createBlock( LIST_CHILD );
		const listParent = createBlock( LIST_PARENT, {}, [ child ] );
		const plain = createBlock( PLAIN );
		const section = createBlock( SECTION, {}, [ listParent, plain ] );

		blocks = {
			section: section.clientId,
			listParent: listParent.clientId,
			listChild: child.clientId,
			plain: plain.clientId,
		};

		render(
			<BlockEditorProvider value={ [ section ] }>
				<CaptureRegistry
					onRegistry={ ( value ) => {
						registry = value;
					} }
				/>
				<InspectorControlsTabs
					blockName={ SECTION }
					clientId={ section.clientId }
					hasBlockStyles={ false }
					tabs={ [ TAB_CONTENT, TAB_LIST_VIEW ] }
					isSectionBlock={ isSectionBlock }
					contentClientIds={ [ listParent.clientId, plain.clientId ] }
				/>
			</BlockEditorProvider>
		);

		// Tabs settles its initial selection asynchronously on mount.
		await waitFor( () =>
			expect( getSelectedTabName() ).toBe( TAB_CONTENT.title )
		);
	}

	function selectBlock( clientId ) {
		return act( async () => {
			await registry.dispatch( blockEditorStore ).selectBlock( clientId );
		} );
	}

	function getSelectedTabName() {
		return screen
			.getAllByRole( 'tab' )
			.find( ( tab ) => tab.getAttribute( 'aria-selected' ) === 'true' )
			?.getAttribute( 'aria-label' );
	}

	beforeEach( () => {
		registry = undefined;
		blocks = undefined;
	} );

	it( 'switches to List View when a child of a list-view content block is selected', async () => {
		await setup();

		await selectBlock( blocks.listChild );

		expect( getSelectedTabName() ).toBe( 'List View' );
	} );

	it( 'resets to Content when a content block without list view is selected from List View', async () => {
		await setup();

		await selectBlock( blocks.listChild );
		expect( getSelectedTabName() ).toBe( 'List View' );

		await selectBlock( blocks.plain );

		expect( getSelectedTabName() ).toBe( 'Content' );
	} );

	it( 'keeps List View selected when the user picks that tab manually', async () => {
		const user = userEvent.setup();
		await setup();

		await user.click( screen.getByRole( 'tab', { name: 'List View' } ) );

		expect( getSelectedTabName() ).toBe( 'List View' );
	} );

	// BlockQuickNavigation selects the block and then asks for the List View
	// tab. Both orderings of those two updates must end on List View.
	it( 'stays on List View after clicking a list-view content item in the Content tab', async () => {
		const user = userEvent.setup();
		await setup();

		await user.click(
			screen.getByRole( 'button', { name: 'List Parent' } )
		);

		expect( getSelectedTabName() ).toBe( 'List View' );
	} );

	// The click-through must also work when it carries no selection change,
	// because the block was already selected.
	it( 'stays on List View when the clicked content item was already selected', async () => {
		const user = userEvent.setup();
		await setup();

		await selectBlock( blocks.listParent );
		expect( getSelectedTabName() ).toBe( 'Content' );

		await user.click(
			screen.getByRole( 'button', { name: 'List Parent' } )
		);

		expect( getSelectedTabName() ).toBe( 'List View' );
	} );

	// A programmatic switch must not make the tab sticky: selecting a
	// different content block afterwards still has to reset to Content.
	it( 'still resets to Content for a different block after a programmatic switch', async () => {
		const user = userEvent.setup();
		await setup();

		await user.click(
			screen.getByRole( 'button', { name: 'List Parent' } )
		);
		expect( getSelectedTabName() ).toBe( 'List View' );

		await selectBlock( blocks.plain );

		expect( getSelectedTabName() ).toBe( 'Content' );
	} );

	// "Edit navigation" and friends request the List View tab for a block and
	// then select it. The request is recorded before the selection lands, so
	// the reset effect sees a content block selected while already on List
	// View in a later commit — the case the programmatic marker exists for.
	it( 'stays on List View when a tab request precedes the selection it was made for', async () => {
		await setup();

		await act( async () => {
			unlock( registry.dispatch( blockEditorStore ) ).requestInspectorTab(
				TAB_LIST_VIEW.name,
				{ openPanel: blocks.listParent }
			);
		} );
		expect( getSelectedTabName() ).toBe( 'List View' );

		await selectBlock( blocks.listParent );

		expect( getSelectedTabName() ).toBe( 'List View' );
	} );

	// "Edit navigation" selects a block and requests its List View in one
	// batch. Selecting a different content item afterwards must still return
	// to the Content tab.
	it( 'resets to Content when a different content item is selected after a tab request', async () => {
		await setup();

		await act( async () => {
			registry.batch( () => {
				registry
					.dispatch( blockEditorStore )
					.selectBlock( blocks.listParent );
				unlock(
					registry.dispatch( blockEditorStore )
				).requestInspectorTab( TAB_LIST_VIEW.name, {
					openPanel: blocks.listParent,
				} );
			} );
		} );
		expect( getSelectedTabName() ).toBe( 'List View' );

		await selectBlock( blocks.plain );

		expect( getSelectedTabName() ).toBe( 'Content' );
	} );

	it( 'opens the ancestor panel when a list child is selected', async () => {
		await setup();

		await selectBlock( blocks.listChild );

		expect(
			unlock( registry.select( blockEditorStore ) ).isListViewPanelOpened(
				blocks.listParent
			)
		).toBe( true );
	} );

	it( 'does nothing outside a section block', async () => {
		await setup( { isSectionBlock: false } );

		await selectBlock( blocks.listChild );

		expect( getSelectedTabName() ).toBe( 'Content' );
	} );
} );
