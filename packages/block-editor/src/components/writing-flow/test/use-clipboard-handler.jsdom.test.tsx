import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	createBlock,
	getBlockType,
	registerBlockType,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import useWritingFlowClipboardHandler from '../use-clipboard-handler';
import useListViewClipboardHandler from '../../list-view/use-clipboard-handler';
import { store as blockEditorStore } from '../../../store';

function WritingFlowFixture() {
	const ref = useWritingFlowClipboardHandler();
	return (
		<div ref={ ref } data-testid="writing-flow">
			<button type="button">Selected block</button>
		</div>
	);
}

function ListViewFixture( { clientId }: { clientId: string } ) {
	const ref = useListViewClipboardHandler( { selectBlock: vi.fn() } );
	return (
		<div ref={ ref }>
			<div role="row" data-block={ clientId }>
				<button type="button">List row</button>
			</div>
		</div>
	);
}

function createClipboardEvent( type: 'copy' | 'cut' | 'paste', html = '' ) {
	const event = new Event( type, {
		bubbles: true,
		cancelable: true,
	} );
	const setData = vi.fn();
	const getData = vi.fn( ( format: string ) =>
		format === 'text/html' ? html : ''
	);
	Object.defineProperty( event, 'clipboardData', {
		value: {
			setData,
			getData,
			types: html ? [ 'text/html' ] : [],
			items: [],
			files: [],
		},
	} );
	return { event, setData, getData };
}

describe( 'useClipboardHandler with locked and single-use blocks', () => {
	beforeAll( () => {
		// @ts-expect-error Test block does not require a category.
		registerBlockType( 'test/regular', {
			apiVersion: 3,
			title: 'Regular',
			supports: {
				splitting: true,
			},
			attributes: {
				content: { type: 'string' },
			},
			save: ( { attributes } ) => <p>{ attributes.content as string }</p>,
		} );
		// @ts-expect-error Test block does not require a category.
		registerBlockType( 'test/single-use', {
			apiVersion: 3,
			title: 'Single Use',
			supports: {
				multiple: false,
			},
			attributes: {
				lock: { type: 'object' },
			},
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/regular' );
		unregisterBlockType( 'test/single-use' );
	} );

	function createEditorRegistry(
		blocks: ReturnType< typeof createBlock >[]
	) {
		const registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );
		registry.register( noticesStore );
		registry
			.dispatch( blocksStore )
			.addBlockTypes( [
				getBlockType( 'test/regular' )!,
				getBlockType( 'test/single-use' )!,
			] );
		registry.dispatch( blockEditorStore ).resetBlocks( blocks );
		return registry;
	}

	it( 'does not flash, notify, copy, or remove on cut when a block is removal-locked in writing flow', () => {
		const lockedBlock = createBlock( 'test/single-use', {
			lock: { remove: true },
		} );
		const registry = createEditorRegistry( [ lockedBlock ] );
		registry
			.dispatch( blockEditorStore )
			.selectBlock( lockedBlock.clientId );

		render(
			<RegistryProvider value={ registry }>
				<WritingFlowFixture />
			</RegistryProvider>
		);

		const button = screen.getByRole( 'button', { name: 'Selected block' } );
		button.focus();

		const { event: cutEvent, setData: setCutData } =
			createClipboardEvent( 'cut' );
		button.dispatchEvent( cutEvent );

		expect( cutEvent.defaultPrevented ).toBe( true );
		expect( setCutData ).not.toHaveBeenCalled();
		expect( registry.select( noticesStore ).getNotices() ).toEqual( [] );
		expect( registry.select( blockEditorStore ).getBlocks() ).toHaveLength(
			1
		);

		const { event: copyEvent, setData: setCopyData } =
			createClipboardEvent( 'copy' );
		button.dispatchEvent( copyEvent );

		expect( copyEvent.defaultPrevented ).toBe( true );
		expect( setCopyData ).toHaveBeenCalledWith(
			'text/html',
			expect.stringContaining( 'wp:test/single-use' )
		);
		expect( registry.select( noticesStore ).getNotices() ).toMatchObject( [
			{
				status: 'success',
				content: 'Copied "Single Use" to clipboard.',
			},
		] );
	} );

	it( 'does not notify or overwrite clipboard on cut when a block is removal-locked in list view', () => {
		const lockedBlock = createBlock( 'test/single-use', {
			lock: { remove: true },
		} );
		const registry = createEditorRegistry( [ lockedBlock ] );
		registry
			.dispatch( blockEditorStore )
			.selectBlock( lockedBlock.clientId );

		render(
			<RegistryProvider value={ registry }>
				<ListViewFixture clientId={ lockedBlock.clientId } />
			</RegistryProvider>
		);

		const rowButton = screen.getByRole( 'button', { name: 'List row' } );
		rowButton.focus();

		const { event: cutEvent, setData: setCutData } =
			createClipboardEvent( 'cut' );
		rowButton.dispatchEvent( cutEvent );

		expect( cutEvent.defaultPrevented ).toBe( true );
		expect( setCutData ).not.toHaveBeenCalled();
		expect( registry.select( noticesStore ).getNotices() ).toEqual( [] );
		expect( registry.select( blockEditorStore ).getBlocks() ).toHaveLength(
			1
		);
	} );

	it( 'prevents pasting an already-used single-use block in list view without replacing the target block', () => {
		const existingSingleUse = createBlock( 'test/single-use' );
		const targetBlock = createBlock( 'test/regular', {
			content: 'Keep me',
		} );
		const registry = createEditorRegistry( [
			existingSingleUse,
			targetBlock,
		] );
		registry
			.dispatch( blockEditorStore )
			.selectBlock( targetBlock.clientId );

		render(
			<RegistryProvider value={ registry }>
				<ListViewFixture clientId={ targetBlock.clientId } />
			</RegistryProvider>
		);

		const rowButton = screen.getByRole( 'button', { name: 'List row' } );
		rowButton.focus();

		const { event: pasteEvent } = createClipboardEvent(
			'paste',
			'<!-- wp:test/single-use /-->'
		);
		rowButton.dispatchEvent( pasteEvent );

		expect( pasteEvent.defaultPrevented ).toBe( true );
		expect( console ).toHaveLogged();
		expect( registry.select( blockEditorStore ).getBlocks() ).toHaveLength(
			2
		);
		expect(
			registry.select( blockEditorStore ).getBlocks()[ 1 ].clientId
		).toBe( targetBlock.clientId );
		expect( registry.select( noticesStore ).getNotices() ).toMatchObject( [
			{
				status: 'warning',
				content: '"Single Use" can only be used once.',
			},
		] );
	} );

	it( 'prevents pasting an already-used single-use block in writing flow without duplicating it', () => {
		const existingSingleUse = createBlock( 'test/single-use' );
		const targetBlock = createBlock( 'test/regular', {
			content: 'Keep me',
		} );
		const registry = createEditorRegistry( [
			existingSingleUse,
			targetBlock,
		] );
		registry
			.dispatch( blockEditorStore )
			.selectionChange( targetBlock.clientId, 'content', 0, 0 );

		render(
			<RegistryProvider value={ registry }>
				<WritingFlowFixture />
			</RegistryProvider>
		);

		const button = screen.getByRole( 'button', { name: 'Selected block' } );
		button.focus();

		const { event: pasteEvent } = createClipboardEvent(
			'paste',
			'<!-- wp:test/single-use /-->'
		);
		button.dispatchEvent( pasteEvent );

		expect( pasteEvent.defaultPrevented ).toBe( true );
		expect( console ).toHaveLogged();
		expect( registry.select( blockEditorStore ).getBlocks() ).toHaveLength(
			2
		);
		expect(
			registry.select( blockEditorStore ).getBlocks()[ 1 ].clientId
		).toBe( targetBlock.clientId );
		expect( registry.select( noticesStore ).getNotices() ).toMatchObject( [
			{
				status: 'warning',
				content: '"Single Use" can only be used once.',
			},
		] );
	} );
} );
