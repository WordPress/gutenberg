import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	loadBlockCatalog,
	lookupBlock,
	searchBlocks,
} from '../block-catalog.js';

describe( 'block-catalog', () => {
	it( 'should load blocks from block-library', async () => {
		const catalog = await loadBlockCatalog();
		assert.ok(
			catalog.size > 50,
			`Expected >50 blocks, got ${ catalog.size }`
		);
	} );

	it( 'should find paragraph by exact name', async () => {
		const meta = await lookupBlock( 'core/paragraph' );
		assert.ok( meta );
		assert.equal( meta.name, 'core/paragraph' );
		assert.ok( 'content' in meta.attributes );
	} );

	it( 'should find paragraph by short name', async () => {
		const meta = await lookupBlock( 'paragraph' );
		assert.ok( meta );
		assert.equal( meta.name, 'core/paragraph' );
	} );

	it( 'should find heading by title', async () => {
		const meta = await lookupBlock( 'Heading' );
		assert.ok( meta );
		assert.equal( meta.name, 'core/heading' );
	} );

	it( 'should detect static blocks as non-dynamic', async () => {
		const meta = await lookupBlock( 'core/paragraph' );
		assert.ok( meta );
		assert.equal( meta.hasDynamicRender, false );
	} );

	it( 'should detect dynamic blocks', async () => {
		const meta = await lookupBlock( 'core/archives' );
		assert.ok( meta );
		assert.equal( meta.hasDynamicRender, true );
	} );

	it( 'should return undefined for unknown blocks', async () => {
		const meta = await lookupBlock( 'core/nonexistent-block-xyz' );
		assert.equal( meta, undefined );
	} );

	it( 'should search blocks by keyword', async () => {
		const results = await searchBlocks( 'image' );
		assert.ok( results.length > 0 );
		const names = results.map( ( b ) => b.name );
		assert.ok( names.includes( 'core/image' ) );
	} );

	it( 'should include supports in block metadata', async () => {
		const meta = await lookupBlock( 'core/paragraph' );
		assert.ok( meta );
		assert.ok( 'color' in meta.supports );
		assert.ok( 'typography' in meta.supports );
	} );
} );
