import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import { createElement } from '@wordpress/element';
import {
	getDeferredInsertions,
	serializeWithoutDeferredInsertions,
} from '../suggestion-deferred-insertions';

describe( 'serializeWithoutDeferredInsertions', () => {
	const editorSelectors = {};
	const registry = { select: () => editorSelectors };

	beforeAll( () => {
		registerBlockType( 'test/text', {
			apiVersion: 3,
			title: 'Text',
			category: 'text',
			attributes: { content: { type: 'string', default: '' } },
			save: ( { attributes }: any ) => attributes.content,
		} );
		registerBlockType( 'test/group', {
			apiVersion: 3,
			title: 'Group',
			category: 'text',
			attributes: {},
			save: () => createElement( InnerBlocks.Content ),
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/text' );
		unregisterBlockType( 'test/group' );
	} );

	afterEach( () => {
		getDeferredInsertions( registry ).clear();
	} );

	it( 'returns null when no block is deferred', () => {
		const blocks = [ createBlock( 'test/text', { content: 'a' } ) ];
		expect(
			serializeWithoutDeferredInsertions( registry, blocks )
		).toBeNull();

		// A deferred block that has left the tree changes nothing.
		getDeferredInsertions( registry ).add( 'gone' );
		expect(
			serializeWithoutDeferredInsertions( registry, blocks )
		).toBeNull();
	} );

	it( 'leaves deferred blocks out at any depth', () => {
		const empty = createBlock( 'test/text' );
		const nestedEmpty = createBlock( 'test/text' );
		const blocks = [
			createBlock( 'test/text', { content: 'a' } ),
			empty,
			createBlock( 'test/group', {}, [
				createBlock( 'test/text', { content: 'b' } ),
				nestedEmpty,
			] ),
		];
		getDeferredInsertions( registry ).add( empty.clientId );
		getDeferredInsertions( registry ).add( nestedEmpty.clientId );

		const content = serializeWithoutDeferredInsertions( registry, blocks );
		expect( content?.match( /wp:test\/text /g ) ).toHaveLength( 4 );
		expect( content ).toContain( 'a' );
		expect( content ).toContain( 'b' );
		// The editor's blocks are untouched.
		expect( blocks ).toHaveLength( 3 );
		expect( blocks[ 2 ].innerBlocks ).toHaveLength( 2 );
	} );

	it( 'shares one set between registry objects of the same editor', () => {
		const thunkRegistry = { select: () => editorSelectors };
		getDeferredInsertions( registry ).add( 'x' );
		expect( getDeferredInsertions( thunkRegistry ).has( 'x' ) ).toBe(
			true
		);
	} );
} );
