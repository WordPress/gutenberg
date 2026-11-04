import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import blockHooks from '../block-hooks';

vi.mock( import( '../../components/inspector-controls/fill' ), () => ( {
	default: ( { children } ) => <>{ children }</>,
} ) );

const BlockHooksControl = blockHooks.edit;

describe( 'block hooks', () => {
	let anchorClientId: string;

	beforeEach( () => {
		registerBlockType( 'test/anchor', {
			apiVersion: 3,
			category: 'text',
			title: 'Anchor',
			attributes: {},
			save: () => null,
		} );
		registerBlockType( 'test/hooked', {
			apiVersion: 3,
			category: 'text',
			title: 'Hooked',
			attributes: {},
			// The anchor lists it in `ignoredHookedBlocks`, as for a block
			// hooked through the `hooked_block_types` filter, but its type has
			// no `blockHooks` to read a position from.
			blockHooks: undefined,
			save: () => null,
		} );

		const anchorBlock = createBlock( 'test/anchor' );
		anchorClientId = anchorBlock.clientId;
		dispatch( blockEditorStore ).resetBlocks( [
			anchorBlock,
			createBlock( 'test/anchor' ),
		] );
	} );

	afterEach( () => {
		dispatch( blockEditorStore ).resetBlocks( [] );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should insert a hooked block without `blockHooks` after the anchor block', async () => {
		const user = userEvent.setup();

		const { unmount } = render(
			<BlockHooksControl
				name="test/anchor"
				clientId={ anchorClientId }
				metadata={ { ignoredHookedBlocks: [ 'test/hooked' ] } }
			/>
		);

		await user.click( screen.getByRole( 'checkbox', { name: 'Hooked' } ) );

		expect(
			select( blockEditorStore )
				.getBlocks()
				.map( ( block ) => block.name )
		).toEqual( [ 'test/anchor', 'test/hooked', 'test/anchor' ] );

		unmount();
	} );
} );
