import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRegistry } from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockTreeVersion } from '../block-tree-version';

beforeAll( () => {
	registerBlockType( 'test/text', {
		apiVersion: 3,
		title: 'Text',
		category: 'text',
		attributes: { content: { type: 'string' } },
		edit: () => null,
		save: () => null,
	} );
	registerBlockType( 'test/container', {
		apiVersion: 3,
		title: 'Container',
		category: 'design',
		attributes: {},
		edit: () => null,
		save: () => null,
	} );
} );

afterAll( () => {
	unregisterBlockType( 'test/text' );
	unregisterBlockType( 'test/container' );
} );

function setup() {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	const text = createBlock( 'test/text', { content: 'a' } );
	const container = createBlock( 'test/container' );
	const inner = createBlock( 'test/text', { content: 'inner' } );
	const dispatch: any = registry.dispatch( blockEditorStore );
	dispatch.resetBlocks( [ text, container ] );
	dispatch.setHasControlledInnerBlocks( container.clientId, true );
	dispatch.replaceInnerBlocks( container.clientId, [ inner ] );
	return {
		select: () => registry.select( blockEditorStore ),
		dispatch,
		text,
		inner,
	};
}

describe( 'getBlockTreeVersion', () => {
	it( 'stays the same while no block changes', () => {
		const { select, dispatch, text } = setup();
		const before = getBlockTreeVersion( select() );
		dispatch.selectBlock( text.clientId );
		expect( getBlockTreeVersion( select() ) ).toBe( before );
	} );

	it( 'changes when a top-level block changes', () => {
		const { select, dispatch, text } = setup();
		const before = getBlockTreeVersion( select() );
		dispatch.updateBlockAttributes( text.clientId, { content: 'b' } );
		expect( getBlockTreeVersion( select() ) ).not.toBe( before );
	} );

	it( 'changes when a block inside controlled inner blocks changes', () => {
		const { select, dispatch, inner } = setup();
		const rootBefore = select().getBlocks();
		const before = getBlockTreeVersion( select() );
		dispatch.updateBlockAttributes( inner.clientId, { content: 'x' } );
		// The root tree does not change for this edit; the version must.
		expect( select().getBlocks() ).toBe( rootBefore );
		expect( getBlockTreeVersion( select() ) ).not.toBe( before );
	} );
} );
