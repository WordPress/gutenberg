/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch, select } from '@wordpress/data';
import {
	createBlock,
	getBlockTypes,
	unregisterBlockType,
} from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import { useBlockBindingsUtils } from '../';

describe( 'useBlockBindingsUtils', () => {
	beforeAll( () => {
		// Register all core blocks
		registerCoreBlocks();
	} );

	let clientId;
	beforeEach( async () => {
		const block = createBlock( 'core/paragraph', {
			metadata: {
				name: 'Block name',
				bindings: {
					prop1: {
						source: 'core/post-meta',
						args: {
							key: 'initial_key',
						},
					},
					prop2: {
						source: 'core/post-meta',
						args: {
							key: 'initial_key',
						},
					},
				},
			},
		} );
		await dispatch( blockEditorStore ).resetBlocks( [ block ] );
		clientId = block.clientId;
	} );

	afterAll( () => {
		// Remove blocks after all tests.
		dispatch( blockEditorStore ).resetBlocks( [] );

		// Clean up registered blocks
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should be possible to update just one connection', async () => {
		renderHook( () => {
			const { updateBlockBindings } = useBlockBindingsUtils( clientId );
			updateBlockBindings( {
				prop1: {
					source: 'core/post-meta',
					args: {
						key: 'new_key',
					},
				},
			} );
		} );
		const { metadata } =
			await select( blockEditorStore ).getBlockAttributes( clientId );
		expect( metadata ).toMatchObject( {
			// Other metadata properties shouldn't change.
			name: 'Block name',
			bindings: {
				prop1: {
					source: 'core/post-meta',
					args: {
						key: 'new_key',
					},
				},
				prop2: {
					source: 'core/post-meta',
					args: {
						key: 'initial_key',
					},
				},
			},
		} );
	} );

	it( 'should be possible to update multiple connections at once', async () => {
		renderHook( () => {
			const { updateBlockBindings } = useBlockBindingsUtils( clientId );
			updateBlockBindings( {
				prop1: {
					source: 'core/post-meta',
					args: {
						key: 'new_key',
					},
				},
				prop2: {
					source: 'core/post-meta',
					args: {
						key: 'new_key',
					},
				},
			} );
		} );
		const { metadata } =
			await select( blockEditorStore ).getBlockAttributes( clientId );
		expect( metadata ).toMatchObject( {
			// Other metadata properties shouldn't change.
			name: 'Block name',
			bindings: {
				prop1: {
					source: 'core/post-meta',
					args: {
						key: 'new_key',
					},
				},
				prop2: {
					source: 'core/post-meta',
					args: {
						key: 'new_key',
					},
				},
			},
		} );
	} );

	it( 'should be possible to remove connections', async () => {
		renderHook( () => {
			const { updateBlockBindings } = useBlockBindingsUtils( clientId );
			updateBlockBindings( {
				prop2: undefined,
			} );
		} );
		const { metadata } =
			await select( blockEditorStore ).getBlockAttributes( clientId );
		expect( metadata ).toMatchObject( {
			// Other metadata properties shouldn't change.
			name: 'Block name',
			bindings: {
				prop1: {
					source: 'core/post-meta',
					args: {
						key: 'initial_key',
					},
				},
			},
		} );
	} );

	it( 'should be possible to remove all connections', async () => {
		renderHook( () => {
			const { removeAllBlockBindings } =
				useBlockBindingsUtils( clientId );
			removeAllBlockBindings();
		} );
		const { metadata } =
			await select( blockEditorStore ).getBlockAttributes( clientId );
		expect( metadata ).toMatchObject( {
			// Other metadata properties shouldn't change.
			name: 'Block name',
		} );
	} );
} );
