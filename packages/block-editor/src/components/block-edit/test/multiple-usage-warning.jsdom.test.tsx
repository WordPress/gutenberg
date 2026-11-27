import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	createBlock,
	registerBlockType,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { MultipleUsageWarning } from '../multiple-usage-warning';
import { store as blockEditorStore } from '../../../store';

describe( 'MultipleUsageWarning', () => {
	beforeAll( () => {
		// @ts-expect-error Test block does not require a category.
		registerBlockType( 'test/single-use', {
			apiVersion: 3,
			title: 'Single Use',
			supports: {
				multiple: false,
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/single-use' );
	} );

	function renderWarning( onReplace?: () => void ) {
		const registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );

		const originalBlock = createBlock( 'test/single-use' );
		const duplicateBlock = createBlock( 'test/single-use' );
		registry
			.dispatch( blockEditorStore )
			.resetBlocks( [ originalBlock, duplicateBlock ] );
		registry
			.dispatch( blockEditorStore )
			.selectBlock( duplicateBlock.clientId );

		const utils = render(
			<RegistryProvider value={ registry }>
				<MultipleUsageWarning
					originalBlockClientId={ originalBlock.clientId }
					name="test/single-use"
					onReplace={ onReplace }
				/>
			</RegistryProvider>
		);

		return {
			...utils,
			registry,
			originalBlock,
		};
	}

	it( 'renders Find original and Remove buttons when onReplace is provided', async () => {
		const user = userEvent.setup();
		const onReplace = vi.fn();

		renderWarning( onReplace );

		expect(
			screen.getByRole( 'button', { name: 'Find original' } )
		).toBeInTheDocument();
		const removeButton = screen.getByRole( 'button', { name: 'Remove' } );
		expect( removeButton ).toBeInTheDocument();

		await user.click( removeButton );
		expect( onReplace ).toHaveBeenCalledWith( [] );
	} );

	it( 'omits the Remove button when onReplace is undefined', async () => {
		const user = userEvent.setup();
		const { registry, originalBlock } = renderWarning();

		const findOriginalButton = screen.getByRole( 'button', {
			name: 'Find original',
		} );
		expect( findOriginalButton ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Remove' } )
		).not.toBeInTheDocument();

		await user.click( findOriginalButton );
		expect(
			registry.select( blockEditorStore ).getSelectedBlockClientId()
		).toBe( originalBlock.clientId );
	} );
} );
