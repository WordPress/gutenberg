import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InnerBlocks } from '@wordpress/block-editor';
import {
	createBlock,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { createElement } from '@wordpress/element';
import { bakeAndStripPatternOverrides } from '..';

const PATTERN_OVERRIDES_BINDING = { source: 'core/pattern-overrides' };

const createText = ( attributes: Record< string, unknown > ) =>
	createBlock( 'test/text', attributes );
const createArea = (
	attributes: Record< string, unknown >,
	innerBlocks?: Block[]
) => createBlock( 'test/area', attributes, innerBlocks );
const getContents = ( blocks: Block[] ) =>
	blocks.map( ( block ) => block.attributes.content );

describe( 'bakeAndStripPatternOverrides', () => {
	beforeAll( () => {
		registerBlockType( 'test/text', {
			apiVersion: 3,
			title: 'Text',
			category: 'text',
			attributes: {
				content: { type: 'string' },
				url: { type: 'string' },
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
		unregisterBlockType( 'test/text' );
		unregisterBlockType( 'test/area' );
	} );

	describe( 'attributes', () => {
		const createTitle = ( bindings: Record< string, unknown > ) =>
			createText( {
				content: 'Default',
				url: 'https://example.com',
				metadata: { name: 'Title', bindings },
			} );

		it( 'sets the overridden values of a named block as its attributes', () => {
			const [ block ] = bakeAndStripPatternOverrides(
				[ createTitle( { __default: PATTERN_OVERRIDES_BINDING } ) ],
				{ Title: { content: 'Overridden' } }
			);

			expect( block.attributes ).toMatchObject( {
				content: 'Overridden',
				url: 'https://example.com',
			} );
			expect( block.attributes.metadata ).toEqual( { name: 'Title' } );
		} );

		it( 'clears an attribute overridden with an empty string', () => {
			const [ block ] = bakeAndStripPatternOverrides(
				[ createTitle( { __default: PATTERN_OVERRIDES_BINDING } ) ],
				{ Title: { url: '' } }
			);

			expect( block.attributes.url ).toBeUndefined();
		} );

		it( 'ignores the overrides of attributes the block type does not have', () => {
			const [ block ] = bakeAndStripPatternOverrides(
				[ createTitle( { __default: PATTERN_OVERRIDES_BINDING } ) ],
				{ Title: { unknown: 'Value' } }
			);

			expect( block.attributes ).not.toHaveProperty( 'unknown' );
		} );

		it( 'removes the pattern overrides bindings of a block without overrides', () => {
			const [ block ] = bakeAndStripPatternOverrides( [
				createTitle( { content: PATTERN_OVERRIDES_BINDING } ),
			] );

			expect( block.attributes.content ).toBe( 'Default' );
			expect( block.attributes.metadata ).toEqual( { name: 'Title' } );
		} );

		it( 'keeps the bindings to other sources', () => {
			const postMetaBinding = {
				source: 'core/post-meta',
				args: { key: 'url' },
			};
			const [ block ] = bakeAndStripPatternOverrides(
				[
					createTitle( {
						content: PATTERN_OVERRIDES_BINDING,
						url: postMetaBinding,
					} ),
				],
				{ Title: { content: 'Overridden' } }
			);

			expect( block.attributes.metadata ).toEqual( {
				name: 'Title',
				bindings: { url: postMetaBinding },
			} );
		} );

		it( 'applies the overrides to nested blocks', () => {
			const [ area ] = bakeAndStripPatternOverrides(
				[
					createArea( {}, [
						createTitle( { __default: PATTERN_OVERRIDES_BINDING } ),
					] ),
				],
				{ Title: { content: 'Overridden' } }
			);

			expect( getContents( area.innerBlocks ) ).toEqual( [
				'Overridden',
			] );
		} );
	} );

	describe( 'inner blocks', () => {
		const createBoundArea = ( bindings: Record< string, unknown > ) =>
			createArea( { metadata: { name: 'Area', bindings } }, [
				createText( { content: 'Default' } ),
			] );

		it( 'replaces the inner blocks of a block that binds them', () => {
			const [ area ] = bakeAndStripPatternOverrides(
				[
					createBoundArea( {
						innerBlocks: PATTERN_OVERRIDES_BINDING,
					} ),
				],
				{
					Area: {
						innerBlocks: serialize( [
							createText( { content: 'First' } ),
							createText( { content: 'Second' } ),
						] ),
					},
				}
			);

			expect( getContents( area.innerBlocks ) ).toEqual( [
				'First',
				'Second',
			] );
			expect( area.attributes.metadata ).toEqual( { name: 'Area' } );
		} );

		it( 'removes the inner blocks overridden with an empty string', () => {
			const [ area ] = bakeAndStripPatternOverrides(
				[
					createBoundArea( {
						innerBlocks: PATTERN_OVERRIDES_BINDING,
					} ),
				],
				{ Area: { innerBlocks: '' } }
			);

			expect( area.innerBlocks ).toEqual( [] );
		} );

		it( 'keeps the inner blocks that are not overridden', () => {
			const [ area ] = bakeAndStripPatternOverrides(
				[
					createBoundArea( {
						innerBlocks: PATTERN_OVERRIDES_BINDING,
					} ),
				],
				{ Area: {} }
			);

			expect( getContents( area.innerBlocks ) ).toEqual( [ 'Default' ] );
			expect( area.attributes.metadata ).toEqual( { name: 'Area' } );
		} );

		it( 'keeps the inner blocks when the override is not block markup', () => {
			const [ area ] = bakeAndStripPatternOverrides(
				[
					createBoundArea( {
						innerBlocks: PATTERN_OVERRIDES_BINDING,
					} ),
				],
				{ Area: { innerBlocks: '<p>Classic content</p>' } }
			);

			expect( getContents( area.innerBlocks ) ).toEqual( [ 'Default' ] );
		} );

		it( 'keeps the inner blocks of a block that does not bind them', () => {
			const [ area ] = bakeAndStripPatternOverrides(
				[ createBoundArea( { __default: PATTERN_OVERRIDES_BINDING } ) ],
				{
					Area: {
						innerBlocks: serialize( [
							createText( { content: 'Override' } ),
						] ),
					},
				}
			);

			expect( getContents( area.innerBlocks ) ).toEqual( [ 'Default' ] );
		} );

		it( 'does not apply the overrides to the overridden inner blocks', () => {
			const [ area ] = bakeAndStripPatternOverrides(
				[
					createBoundArea( {
						innerBlocks: PATTERN_OVERRIDES_BINDING,
					} ),
				],
				{
					Area: {
						innerBlocks: serialize( [
							createText( {
								content: 'Stored',
								metadata: {
									name: 'Title',
									bindings: {
										__default: PATTERN_OVERRIDES_BINDING,
									},
								},
							} ),
						] ),
					},
					Title: { content: 'Overridden' },
				}
			);

			expect( area.innerBlocks[ 0 ].attributes ).toMatchObject( {
				content: 'Stored',
				metadata: { name: 'Title' },
			} );
			expect(
				area.innerBlocks[ 0 ].attributes.metadata
			).not.toHaveProperty( 'bindings' );
		} );
	} );

	it( 'does not mutate the given blocks', () => {
		const blocks = [
			createArea(
				{
					metadata: {
						name: 'Area',
						bindings: { innerBlocks: PATTERN_OVERRIDES_BINDING },
					},
				},
				[ createText( { content: 'Default' } ) ]
			),
			createText( {
				content: 'Default',
				metadata: {
					name: 'Title',
					bindings: { __default: PATTERN_OVERRIDES_BINDING },
				},
			} ),
		];
		const blocksBefore = structuredClone( blocks );

		bakeAndStripPatternOverrides( blocks, {
			Area: { innerBlocks: '' },
			Title: { content: 'Overridden' },
		} );

		expect( blocks ).toEqual( blocksBefore );
	} );
} );
