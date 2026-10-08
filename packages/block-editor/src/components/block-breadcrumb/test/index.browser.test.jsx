import { beforeEach, afterEach, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
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
import '../style.scss';
import '../../../../../interface/src/components/interface-skeleton/style.scss';

let registry;
let blocks;

beforeEach( async () => {
	registerBlockType( 'test/breadcrumb', {
		apiVersion: 3,
		title: 'Breadcrumb test block',
		category: 'text',
		attributes: { metadata: { type: 'object' } },
		__experimentalLabel: ( attributes ) => attributes.metadata?.name,
		save: () => null,
	} );
	registry = createRegistry();
	registry.register( blocksStore );
	registry
		.dispatch( blocksStore )
		.addBlockTypes( getBlockType( 'test/breadcrumb' ) );
	registry.register( blockEditorStore );
	let innerBlocks = [];
	blocks = [];
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

it( 'selects an ancestor from its fragment link and clears selection from the document link', async () => {
	const refsMap = observableMap();
	await render(
		<RegistryProvider value={ registry }>
			<BlockRefs.Provider value={ { refsMap, eventHandlers: new Map() } }>
				<div role="region" aria-label="Editor canvas" tabIndex={ -1 }>
					<div
						className="editor-styles-wrapper"
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
	const ancestor = page.getByRole( 'link', {
		name: 'Ancestor 3',
		exact: true,
	} );
	await expect
		.element( ancestor )
		.toHaveAttribute( 'href', `#block-${ blocks[ 3 ].clientId }` );
	ancestor.element().focus();
	await userEvent.keyboard( '{Enter}' );
	expect(
		registry.select( blockEditorStore ).getSelectedBlockClientId()
	).toBe( blocks[ 3 ].clientId );
	await page.getByRole( 'link', { name: 'Document', exact: true } ).click();
	expect(
		registry.select( blockEditorStore ).getSelectedBlockClientId()
	).toBeNull();
	await expect
		.element(
			page
				.getByRole( 'listitem' )
				.getByText( 'Document', { exact: true } )
		)
		.toHaveAttribute( 'aria-current', 'true' );
	await expect
		.element( page.getByRole( 'region', { name: 'Editor canvas' } ) )
		.toHaveFocus();
} );

it( 'collapses ancestors in a narrow footer and selects them from the overflow menu', async () => {
	await render(
		<RegistryProvider value={ registry }>
			<div
				className="interface-interface-skeleton__footer"
				style={ { display: 'flex', position: 'relative', width: 350 } }
			>
				<BlockBreadcrumb />
			</div>
		</RegistryProvider>
	);
	const trigger = page.getByRole( 'button', {
		name: /hidden breadcrumb item/,
	} );
	await expect.element( trigger ).toBeVisible();
	await trigger.click();
	await page
		.getByRole( 'menuitem', { name: 'Ancestor 1', exact: true } )
		.click();
	await expect.element( page.getByRole( 'menu' ) ).not.toBeInTheDocument();
	expect(
		registry.select( blockEditorStore ).getSelectedBlockClientId()
	).toBe( blocks[ 1 ].clientId );
} );

it( 'restores ancestors to the breadcrumb trail when more space is available', async () => {
	const screen = await render(
		<RegistryProvider value={ registry }>
			<div style={ { width: 280 } }>
				<BlockBreadcrumb />
			</div>
		</RegistryProvider>
	);
	await expect
		.element(
			page.getByRole( 'button', { name: /hidden breadcrumb item/ } )
		)
		.toBeVisible();
	await screen.rerender(
		<RegistryProvider value={ registry }>
			<div style={ { width: 1500 } }>
				<BlockBreadcrumb />
			</div>
		</RegistryProvider>
	);
	await expect
		.element(
			page.getByRole( 'button', { name: /hidden breadcrumb item/ } )
		)
		.not.toBeInTheDocument();
	await expect
		.element(
			page.getByRole( 'link', { name: 'Ancestor 1', exact: true } )
		)
		.toBeVisible();
} );
