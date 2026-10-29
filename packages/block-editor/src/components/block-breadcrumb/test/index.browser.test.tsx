import { beforeEach, afterEach, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { observableMap } from '@wordpress/compose';
import {
	createBlock,
	getBlockType,
	registerBlockType,
	unregisterBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '../../../store';
import BlockBreadcrumb from '../';
import { BlockRefs } from '../../provider/block-refs-provider';

type BreadcrumbAttributes = {
	metadata?: { name?: string };
};

let registry: ReturnType< typeof createRegistry >;
let blocks: ReturnType< typeof createBlock >[];

beforeEach( async () => {
	registerBlockType< BreadcrumbAttributes >( 'test/breadcrumb', {
		apiVersion: 3,
		title: 'Breadcrumb test block',
		category: 'text',
		attributes: { metadata: { type: 'object' } },
		__experimentalLabel: ( attributes ) => attributes.metadata?.name ?? '',
		save: () => null,
	} );
	registry = createRegistry();
	registry.register( blocksStore );
	const blockType = getBlockType( 'test/breadcrumb' );
	if ( ! blockType ) {
		throw new Error(
			'Expected the breadcrumb test block to be registered.'
		);
	}
	registry.dispatch( blocksStore ).addBlockTypes( blockType );
	registry.register( blockEditorStore );
	let innerBlocks: ReturnType< typeof createBlock >[] = [];
	blocks = [];
	// Nest six blocks, placing Ancestor 5 five levels below Ancestor 0.
	for ( let index = 5; index >= 0; index-- ) {
		const block = createBlock(
			'test/breadcrumb',
			{ metadata: { name: `Ancestor ${ index }` } },
			innerBlocks
		);
		blocks.unshift( block );
		innerBlocks = [ block ];
	}
	await registry.dispatch( blockEditorStore ).resetBlocks( innerBlocks );
	await registry
		.dispatch( blockEditorStore )
		.selectBlock( blocks[ 5 ].clientId );
} );

afterEach( () => unregisterBlockType( 'test/breadcrumb' ) );

it( 'clears selection and focuses the editor canvas from the document button', async () => {
	// Supply block DOM refs so the document button can find and focus the editor canvas.
	const refsMap = observableMap();
	await render(
		<RegistryProvider value={ registry }>
			<BlockRefs.Provider value={ { refsMap, eventHandlers: new Map() } }>
				<div
					className="editor-styles-wrapper"
					role="group"
					aria-label="Editor canvas"
					tabIndex={ -1 }
				>
					<div
						ref={ ( element ) => {
							for ( const block of blocks ) {
								refsMap.set( block.clientId, element );
							}
						} }
					/>
				</div>
				<div style={ { width: 1500 } }>
					<BlockBreadcrumb />
				</div>
			</BlockRefs.Provider>
		</RegistryProvider>
	);

	// Activating the document button clears the block selection.
	await page.getByRole( 'button', { name: 'Document', exact: true } ).click();
	expect(
		registry.select( blockEditorStore ).getSelectedBlockClientId()
	).toBeNull();

	// The document becomes the current breadcrumb after selection is cleared.
	await expect
		.element(
			page
				.getByRole( 'listitem' )
				.getByText( 'Document', { exact: true } )
		)
		.toHaveAttribute( 'aria-current', 'true' );

	// Focus returns to the editor canvas after activating the document button.
	await expect
		.element( page.getByRole( 'group', { name: 'Editor canvas' } ) )
		.toHaveFocus();
} );

it( 'collapses ancestors in a narrow container and selects them from the overflow menu', async () => {
	await render(
		<RegistryProvider value={ registry }>
			<div style={ { display: 'flex', width: 350 } }>
				<BlockBreadcrumb />
			</div>
		</RegistryProvider>
	);

	// A narrow container moves ancestors into an overflow menu.
	const trigger = page.getByRole( 'button', {
		name: /hidden breadcrumb item/,
	} );
	await expect.element( trigger ).toBeVisible();

	// Selecting a hidden ancestor closes the menu and selects its block.
	await trigger.click();
	await page
		.getByRole( 'menuitem', { name: 'Ancestor 1', exact: true } )
		.click();
	await expect.element( page.getByRole( 'menu' ) ).not.toBeInTheDocument();
	expect(
		registry.select( blockEditorStore ).getSelectedBlockClientId()
	).toBe( blocks[ 1 ].clientId );
} );
