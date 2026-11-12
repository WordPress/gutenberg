import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import BlockHTML from '../block-html';
import InnerBlocks from '../../inner-blocks';
import { store as blockEditorStore } from '../../../store';
import type { TreeBlock } from '../../../store/types';

function setup( block: Block ) {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );
	// What the block's inner blocks register when its edit is mounted, which
	// it stays while the block is edited as HTML.
	registry
		.dispatch( blockEditorStore )
		.updateBlockListSettings( block.clientId, {} );

	render(
		<RegistryProvider value={ registry }>
			<BlockHTML clientId={ block.clientId } />
		</RegistryProvider>
	);

	const textarea = screen.getByRole( 'textbox' ) as HTMLTextAreaElement;

	return {
		registry,
		textarea,
		edit( value: string ) {
			fireEvent.change( textarea, { target: { value } } );
			fireEvent.blur( textarea );
		},
		getBlock: () =>
			registry
				.select( blockEditorStore )
				.getBlock( block.clientId ) as TreeBlock,
	};
}

const getClientIds = ( blocks: TreeBlock[] | Block[] ) =>
	blocks.map( ( { clientId } ) => clientId );

const createWrapper = ( attributes = {} ) =>
	createBlock( 'test/wrapper', attributes, [
		createBlock( 'test/leaf', { content: 'A' } ),
		createBlock( 'test/leaf', { content: 'B' } ),
	] );

describe( 'BlockHTML', () => {
	beforeAll( () => {
		// @ts-expect-error The test block needs no category.
		registerBlockType( 'test/wrapper', {
			apiVersion: 3,
			title: 'Wrapper',
			attributes: {
				title: {
					type: 'string',
					source: 'attribute',
					selector: 'div',
					attribute: 'title',
				},
				draft: { type: 'string', role: 'local' },
			},
			edit: () => null,
			save: ( { attributes } ) => (
				<div className="wrapper" title={ attributes.title as string }>
					<InnerBlocks.Content />
				</div>
			),
		} );

		// @ts-expect-error The test block needs no category.
		registerBlockType( 'test/leaf', {
			apiVersion: 3,
			title: 'Leaf',
			attributes: {
				content: { type: 'string', source: 'text', selector: 'p' },
			},
			edit: () => null,
			save: ( { attributes } ) => <p>{ attributes.content as string }</p>,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/wrapper' );
		unregisterBlockType( 'test/leaf' );
	} );

	describe( 'with inner blocks', () => {
		it( 'applies changes to the block itself and keeps the inner blocks', () => {
			const wrapper = createWrapper( { title: 'One', draft: 'kept' } );
			const { textarea, edit, getBlock } = setup( wrapper );

			edit( textarea.value.replace( 'title="One"', 'title="Two"' ) );

			expect( getBlock() ).toMatchObject( {
				isValid: true,
				attributes: { title: 'Two', draft: 'kept' },
			} );
			expect( getClientIds( getBlock().innerBlocks ) ).toEqual(
				getClientIds( wrapper.innerBlocks )
			);
		} );

		it( 'applies changes to the inner blocks', () => {
			const { textarea, edit, getBlock } = setup( createWrapper() );

			edit( textarea.value.replace( '<p>B</p>', '<p>C</p>' ) );

			expect( getBlock() ).toMatchObject( {
				isValid: true,
				innerBlocks: [
					{ name: 'test/leaf', attributes: { content: 'A' } },
					{ name: 'test/leaf', attributes: { content: 'C' } },
				],
			} );
		} );

		it( 'removes an inner block removed from the HTML', () => {
			const wrapper = createWrapper();
			const { textarea, edit, getBlock } = setup( wrapper );

			edit(
				textarea.value.replace(
					serialize( [ wrapper.innerBlocks[ 1 ] ] ),
					''
				)
			);

			expect( getBlock() ).toMatchObject( {
				isValid: true,
				innerBlocks: [ { attributes: { content: 'A' } } ],
			} );
			expect( getBlock().innerBlocks ).toHaveLength( 1 );
		} );

		it( 'leaves the inner blocks alone when one is not closed', () => {
			const wrapper = createWrapper();
			const { textarea, edit, getBlock } = setup( wrapper );

			// Without the guard the next block would be parsed as a child of
			// this one and dropped on save.
			edit( textarea.value.replace( '<!-- /wp:test/leaf -->', '' ) );

			expect( getBlock().isValid ).toBe( false );
			expect( getClientIds( getBlock().innerBlocks ) ).toEqual(
				getClientIds( wrapper.innerBlocks )
			);
		} );

		it( 'leaves the inner blocks alone when a closer has no opener', () => {
			const wrapper = createWrapper();
			const { textarea, edit, getBlock } = setup( wrapper );

			// Without the guard the block would end at the extra closer, and
			// everything after it would be dropped.
			edit(
				textarea.value.replace(
					/(.*)(<!-- \/wp:test\/leaf -->)/s,
					'$1$2$2'
				)
			);

			expect( getBlock().isValid ).toBe( false );
			expect( serialize( [ getBlock() ] ) ).toContain( '</div>' );
			expect( getClientIds( getBlock().innerBlocks ) ).toEqual(
				getClientIds( wrapper.innerBlocks )
			);
		} );

		it( 'leaves the inner blocks alone when the block is locked', () => {
			const wrapper = createWrapper();
			const { registry, textarea, edit, getBlock } = setup( wrapper );
			registry
				.dispatch( blockEditorStore )
				.updateBlockListSettings( wrapper.clientId, {
					templateLock: 'all',
				} );

			edit(
				textarea.value.replace(
					serialize( [ wrapper.innerBlocks[ 1 ] ] ),
					''
				)
			);

			expect( getBlock().isValid ).toBe( false );
			expect( getClientIds( getBlock().innerBlocks ) ).toEqual(
				getClientIds( wrapper.innerBlocks )
			);
		} );

		it( 'keeps the inner blocks when the HTML is emptied', () => {
			// No attribute is sourced from the HTML, so emptying it leaves the
			// block unchanged.
			const { textarea, edit, getBlock } = setup( createWrapper() );

			edit( '' );

			expect( textarea.value ).toContain( '<p>B</p>' );

			// Leaving the field again must not remove the inner blocks.
			fireEvent.blur( textarea );

			expect( getBlock().innerBlocks ).toHaveLength( 2 );
		} );

		it( 'saves invalid markup as typed', () => {
			const { textarea, edit, getBlock } = setup( createWrapper() );

			edit(
				textarea.value.replace( /<div[^>]*>/, '$&<span>Stray</span>' )
			);

			expect( getBlock().isValid ).toBe( false );
			expect( serialize( [ getBlock() ] ) ).toContain(
				'<span>Stray</span>'
			);
			expect( console ).toHaveErrored();
			expect( console ).toHaveWarned();
		} );
	} );
} );
