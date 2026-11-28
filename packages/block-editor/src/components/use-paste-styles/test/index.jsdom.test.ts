import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
// @ts-expect-error `@wordpress/block-library` does not expose type declarations for its entry point.
import { registerCoreBlocks } from '@wordpress/block-library';
import {
	createBlock,
	getBlockTypes,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import { store as blockEditorStore } from '../../../store';
import usePasteStyles from '../';

describe( 'usePasteStyles', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	afterAll( () => {
		vi.unstubAllGlobals();
		dispatch( blockEditorStore ).resetBlocks( [] );
		getBlockTypes().forEach( ( blockType ) => {
			unregisterBlockType( blockType.name );
		} );
	} );

	it( "pasting one container's styles preserves its children's styles", async () => {
		const sourceBlock = createBlock(
			'core/group',
			{ style: { color: { background: '#ff0000' } } },
			[
				createBlock( 'core/paragraph', {
					content: 'Source paragraph',
					style: { color: { text: '#00ff00' } },
				} ),
				createBlock(
					'core/group',
					{ style: { spacing: { padding: { top: '20px' } } } },
					[
						createBlock( 'core/paragraph', {
							content: 'Source nested paragraph',
							style: { typography: { fontSize: '30px' } },
						} ),
					]
				),
			]
		);
		const targetBlock = createBlock(
			'core/group',
			{ style: { color: { background: '#0000ff' } } },
			[
				createBlock( 'core/paragraph', {
					content: 'Target paragraph',
					style: { color: { text: '#ff00ff' } },
				} ),
				createBlock(
					'core/group',
					{ style: { spacing: { padding: { top: '10px' } } } },
					[
						createBlock( 'core/paragraph', {
							content: 'Target nested paragraph',
						} ),
					]
				),
			]
		);
		vi.stubGlobal( 'navigator', {
			clipboard: {
				readText: vi.fn().mockResolvedValue( serialize( sourceBlock ) ),
			},
		} );
		await dispatch( blockEditorStore ).resetBlocks( [ targetBlock ] );
		const { result } = renderHook( () => usePasteStyles() );

		await act( async () => {
			await result.current( [ targetBlock ] );
		} );

		const updatedBlock = select( blockEditorStore ).getBlock(
			targetBlock.clientId
		);
		expect( updatedBlock?.attributes.style ).toEqual(
			sourceBlock.attributes.style
		);
		expect( updatedBlock?.innerBlocks ).toEqual( targetBlock.innerBlocks );
	} );
} );
