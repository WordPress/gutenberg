import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	InnerBlocks,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	createBlock,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { createRegistry } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import { convertSyncedPatternToStatic } from '../actions';
import type { PatternsThunkArgs } from '../types';

const PATTERN_OVERRIDES_BINDING = { source: 'core/pattern-overrides' };

const getContents = ( blocks: Block[] ) =>
	blocks.map( ( block ) => block.attributes.content );

const createText = ( content: string, name?: string ) =>
	createBlock( 'test/text', {
		content,
		metadata: name
			? { name, bindings: { __default: PATTERN_OVERRIDES_BINDING } }
			: undefined,
	} );

const createArea = ( name: string, innerBlocks: Block[] ) =>
	createBlock(
		'test/area',
		{
			metadata: {
				name,
				bindings: { innerBlocks: PATTERN_OVERRIDES_BINDING },
			},
		},
		innerBlocks
	);

/**
 * Detaches a synced pattern and returns the blocks that replace it.
 *
 * @param content             The overrides of the pattern instance.
 * @param innerBlocks         The blocks of the pattern.
 * @param supportedAttributes The attributes block bindings support, by block.
 *
 * @return The blocks of the editor after detaching.
 */
function detachPattern(
	content: Record< string, unknown >,
	innerBlocks: Block[],
	supportedAttributes: Record< string, string[] > = {
		'test/area': [ 'innerBlocks' ],
	}
) {
	const pattern = createBlock(
		'core/block',
		{ ref: 1, content },
		innerBlocks
	);
	const registry = createRegistry();
	registry.register( blockEditorStore );
	registry.dispatch( blockEditorStore ).updateSettings( {
		__experimentalBlockBindingsSupportedAttributes: supportedAttributes,
	} );
	registry.dispatch( blockEditorStore ).resetBlocks( [ pattern ] );

	// The action only uses the registry.
	convertSyncedPatternToStatic( pattern.clientId )( {
		registry,
	} as unknown as PatternsThunkArgs );

	return registry.select( blockEditorStore ).getBlocks();
}

/**
 * Detaches a synced pattern holding an area whose inner blocks can be
 * overridden, and a named block, and returns the blocks that replace it.
 *
 * @param content The overrides of the pattern instance.
 *
 * @return The blocks of the editor after detaching.
 */
function detachPatternWithArea( content: Record< string, unknown > ) {
	return detachPattern( content, [
		createArea( 'Area', [ createText( 'Default' ) ] ),
		createText( 'Default', 'Title' ),
	] );
}

describe( 'convertSyncedPatternToStatic', () => {
	beforeAll( () => {
		registerBlockType( 'core/block', {
			apiVersion: 3,
			title: 'Pattern',
			category: 'reusable',
			attributes: {
				ref: { type: 'number' },
				content: { type: 'object' },
			},
			save: () => null,
		} );
		registerBlockType( 'test/text', {
			apiVersion: 3,
			title: 'Text',
			category: 'text',
			attributes: {
				content: { type: 'string' },
				metadata: { type: 'object' },
			},
			save: () => null,
		} );
		registerBlockType( 'test/area', {
			apiVersion: 3,
			title: 'Area',
			category: 'design',
			attributes: {
				metadata: { type: 'object' },
			},
			save: () => createElement( InnerBlocks.Content ),
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/block' );
		unregisterBlockType( 'test/text' );
		unregisterBlockType( 'test/area' );
	} );

	it( 'keeps the overridden inner blocks of a block', () => {
		const [ area ] = detachPatternWithArea( {
			Area: {
				innerBlocks: serialize( [
					createText( 'First' ),
					createText( 'Second' ),
				] ),
			},
		} );

		expect( area.attributes.metadata ).toEqual( { name: 'Area' } );
		expect( getContents( area.innerBlocks ) ).toEqual( [
			'First',
			'Second',
		] );
	} );

	it( 'keeps the inner blocks of a block emptied in the pattern instance', () => {
		const [ area ] = detachPatternWithArea( {
			Area: { innerBlocks: '' },
		} );

		expect( area.innerBlocks ).toEqual( [] );
	} );

	it( 'keeps the inner blocks of the pattern when they are not overridden', () => {
		const [ area, title ] = detachPatternWithArea( {
			Title: { content: 'Overridden' },
		} );

		expect( getContents( area.innerBlocks ) ).toEqual( [ 'Default' ] );
		expect( title.attributes ).toMatchObject( {
			content: 'Overridden',
			metadata: { name: 'Title' },
		} );
	} );

	it( 'keeps the inner blocks of the pattern when the block can not bind them', () => {
		const [ area ] = detachPattern(
			{
				Area: {
					innerBlocks: serialize( [ createText( 'Override' ) ] ),
				},
			},
			[ createArea( 'Area', [ createText( 'Default' ) ] ) ],
			{}
		);

		expect( getContents( area.innerBlocks ) ).toEqual( [ 'Default' ] );
	} );

	it( 'keeps the inner blocks of the pattern when the override is not block markup', () => {
		const [ area ] = detachPatternWithArea( {
			Area: { innerBlocks: '<p>Classic content</p>' },
		} );

		expect( getContents( area.innerBlocks ) ).toEqual( [ 'Default' ] );
	} );

	it.each( [
		[ 'a no-break space', '\u00a0' ],
		[ 'a byte order mark', '\ufeff' ],
		[ 'a vertical tab', '\v' ],
	] )(
		'keeps the inner blocks of the pattern when the override starts with %s',
		( _name, prefix ) => {
			const [ area ] = detachPatternWithArea( {
				Area: {
					innerBlocks:
						prefix + serialize( [ createText( 'Override' ) ] ),
				},
			} );

			expect( getContents( area.innerBlocks ) ).toEqual( [ 'Default' ] );
		}
	);

	it.each( [
		[ 'a space', ' ' ],
		[ 'a tab', '\t' ],
		[ 'a newline', '\n' ],
	] )(
		'keeps the overridden inner blocks when they start with %s',
		( _name, prefix ) => {
			const [ area ] = detachPatternWithArea( {
				Area: {
					innerBlocks:
						prefix + serialize( [ createText( 'Override' ) ] ),
				},
			} );

			expect( getContents( area.innerBlocks ) ).toEqual( [ 'Override' ] );
		}
	);

	it( 'applies the overrides of the instance to the blocks inside the overridden inner blocks', () => {
		const [ area, title ] = detachPatternWithArea( {
			Area: {
				innerBlocks: serialize( [
					createText( 'Stored', 'Title' ),
					createText( 'Stored', 'Subtitle' ),
				] ),
			},
			Title: { content: 'Overridden' },
		} );

		expect( area.innerBlocks.map( ( block ) => block.attributes ) ).toEqual(
			[
				{ content: 'Overridden', metadata: { name: 'Title' } },
				{ content: 'Stored', metadata: { name: 'Subtitle' } },
			]
		);
		expect( title.attributes.content ).toBe( 'Overridden' );
	} );

	it( 'applies the overrides of the instance only to the blocks bound to them inside the overridden inner blocks, which keep their other bindings', () => {
		const otherBinding = { source: 'test/other' };
		const [ area ] = detachPatternWithArea( {
			Area: {
				innerBlocks: serialize( [
					createBlock( 'test/text', {
						content: 'Stored',
						metadata: {
							name: 'Title',
							bindings: {
								content: PATTERN_OVERRIDES_BINDING,
								url: otherBinding,
							},
						},
					} ),
					createBlock( 'test/text', {
						content: 'Renamed',
						metadata: { name: 'Title' },
					} ),
					createBlock( 'test/text', {
						content: 'Bound elsewhere',
						metadata: { bindings: { content: otherBinding } },
					} ),
				] ),
			},
			Title: { content: 'Overridden' },
		} );

		expect( area.innerBlocks.map( ( block ) => block.attributes ) ).toEqual(
			[
				{
					content: 'Overridden',
					metadata: {
						name: 'Title',
						bindings: { url: otherBinding },
					},
				},
				{ content: 'Renamed', metadata: { name: 'Title' } },
				{
					content: 'Bound elsewhere',
					metadata: { bindings: { content: otherBinding } },
				},
			]
		);
	} );

	it( 'keeps the overridden inner blocks of the blocks inside overridden inner blocks', () => {
		const [ outer ] = detachPattern(
			{
				Outer: {
					innerBlocks: serialize( [
						createText( 'Outer' ),
						createArea( 'Inner', [ createText( 'Default' ) ] ),
					] ),
				},
				Inner: {
					innerBlocks: serialize( [
						createText( 'Stored', 'Title' ),
					] ),
				},
				Title: { content: 'Overridden' },
			},
			[ createArea( 'Outer', [ createText( 'Default' ) ] ) ]
		);

		const [ text, inner ] = outer.innerBlocks;
		expect( text.attributes.content ).toBe( 'Outer' );
		expect( inner.attributes.metadata ).toEqual( { name: 'Inner' } );
		expect(
			inner.innerBlocks.map( ( block ) => block.attributes )
		).toEqual( [ { content: 'Overridden', metadata: { name: 'Title' } } ] );
	} );

	it( 'keeps the own inner blocks of a block overridden with the inner blocks it is in', () => {
		const [ outer ] = detachPattern(
			{
				Area: {
					innerBlocks: serialize( [
						createText( 'Bound' ),
						createArea( 'Area', [
							createText( 'Inner own', 'Title' ),
						] ),
					] ),
				},
				Title: { content: 'Overridden' },
			},
			[ createArea( 'Area', [ createText( 'Outer own' ) ] ) ]
		);

		const [ text, inner ] = outer.innerBlocks;
		expect( text.attributes.content ).toBe( 'Bound' );
		expect( inner.attributes.metadata ).toEqual( { name: 'Area' } );
		// The own inner blocks are overridden too.
		expect(
			inner.innerBlocks.map( ( block ) => block.attributes )
		).toEqual( [ { content: 'Overridden', metadata: { name: 'Title' } } ] );
	} );

	it( 'keeps the own inner blocks of a block overridden with the inner blocks it is in, all the way down', () => {
		const [ outer ] = detachPattern(
			{
				Area: {
					innerBlocks: serialize( [
						createArea( 'Area', [
							createArea( 'Area', [ createText( 'Leaf' ) ] ),
						] ),
					] ),
				},
			},
			[ createArea( 'Area', [ createText( 'Outer own' ) ] ) ]
		);

		const [ inner ] = outer.innerBlocks;
		const [ innermost ] = inner.innerBlocks;
		expect( getContents( innermost.innerBlocks ) ).toEqual( [ 'Leaf' ] );
	} );

	it( 'keeps the own inner blocks of a block nested in eight overridden inner blocks', () => {
		const content: Record< string, unknown > = {};
		for ( let level = 1; level <= 9; level++ ) {
			content[ `Level ${ level }` ] = {
				innerBlocks: serialize( [
					createText( `Level ${ level }.` ),
					createArea( `Level ${ level + 1 }`, [
						createText( `Own ${ level + 1 }.` ),
					] ),
				] ),
			};
		}

		let [ area ] = detachPattern( content, [
			createArea( 'Level 1', [ createText( 'Own 1.' ) ] ),
		] );

		for ( let level = 1; level <= 8; level++ ) {
			const [ text, nextArea ] = area.innerBlocks;
			expect( text.attributes.content ).toBe( `Level ${ level }.` );
			area = nextArea;
		}
		expect( area.attributes.metadata ).toEqual( { name: 'Level 9' } );
		expect( getContents( area.innerBlocks ) ).toEqual( [ 'Own 9.' ] );
	} );
} );
