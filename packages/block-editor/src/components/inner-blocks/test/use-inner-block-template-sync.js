/**
 * External dependencies
 */
import { act, render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { createRegistry, RegistryProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useInnerBlockTemplateSync from '../use-inner-block-template-sync';
import { store as blockEditorStore, storeConfig } from '../../../store';
import { STORE_NAME as blockEditorStoreName } from '../../../store/constants';

const PARENT_BLOCK = 'test/template-sync-parent';
const CHILD_BLOCK = 'test/template-sync-child';
const TEMPLATE = [ [ CHILD_BLOCK, { fruit: 'apple' } ] ];

function createBlockEditorRegistry() {
	const registry = createRegistry();
	registry.registerStore( blockEditorStoreName, storeConfig );
	return registry;
}

async function flushTemplateSync() {
	await act( async () => {
		await Promise.resolve();
	} );
}

function TemplateSync( {
	clientId,
	template = TEMPLATE,
	templateLock = false,
	templateInsertUpdatesSelection = false,
} ) {
	useInnerBlockTemplateSync(
		clientId,
		template,
		templateLock,
		templateInsertUpdatesSelection
	);
	return null;
}

describe( 'useInnerBlockTemplateSync', () => {
	beforeAll( () => {
		registerBlockType( PARENT_BLOCK, {
			apiVersion: 3,
			title: 'Template sync parent',
			category: 'text',
		} );
		registerBlockType( CHILD_BLOCK, {
			apiVersion: 3,
			title: 'Template sync child',
			category: 'text',
			attributes: {
				fruit: {
					type: 'string',
				},
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( CHILD_BLOCK );
		unregisterBlockType( PARENT_BLOCK );
	} );

	it( 'fills an empty block template when the block was not remotely synced', async () => {
		const registry = createBlockEditorRegistry();
		const parentBlock = createBlock( PARENT_BLOCK );

		act( () => {
			registry
				.dispatch( blockEditorStore )
				.resetBlocks( [ parentBlock ] );
		} );

		render(
			<RegistryProvider value={ registry }>
				<TemplateSync clientId={ parentBlock.clientId } />
			</RegistryProvider>
		);

		await flushTemplateSync();

		expect(
			registry
				.select( blockEditorStore )
				.getBlocks( parentBlock.clientId )
		).toEqual( [
			expect.objectContaining( {
				name: CHILD_BLOCK,
				attributes: { fruit: 'apple' },
			} ),
		] );
	} );

	it( 'skips an empty remote-synced block and treats the template as seen', async () => {
		const registry = createBlockEditorRegistry();
		const parentBlock = createBlock( PARENT_BLOCK );

		act( () => {
			registry
				.dispatch( blockEditorStore )
				.resetBlocks( [ parentBlock ] );
			registry
				.dispatch( blockEditorStore )
				.__unstableMarkRemoteSyncedBlocks( [ parentBlock.clientId ] );
		} );

		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<TemplateSync clientId={ parentBlock.clientId } />
			</RegistryProvider>
		);

		await flushTemplateSync();

		expect(
			registry
				.select( blockEditorStore )
				.getBlocks( parentBlock.clientId )
		).toHaveLength( 0 );
		expect(
			registry
				.select( blockEditorStore )
				.__unstableIsRemoteSyncedBlock( parentBlock.clientId )
		).toBe( false );

		rerender(
			<RegistryProvider value={ registry }>
				<TemplateSync
					clientId={ parentBlock.clientId }
					templateInsertUpdatesSelection
				/>
			</RegistryProvider>
		);

		await flushTemplateSync();

		expect(
			registry
				.select( blockEditorStore )
				.getBlocks( parentBlock.clientId )
		).toHaveLength( 0 );
	} );
} );
