import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	createBlock,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import { createRegistry } from '@wordpress/data';
import * as paragraphBlock from '@wordpress/block-library/build-module/paragraph/index.mjs';
import * as groupBlock from '@wordpress/block-library/build-module/group/index.mjs';
import patternOverridesBindings from '../pattern-overrides';

const PATTERN_OVERRIDES_BINDING = { source: 'core/pattern-overrides' };

describe( 'pattern-overrides bindings', () => {
	const blockAttributes = {
		content: 'original content',
		metadata: {
			name: 'Editable Paragraph',
			bindings: {
				content: { source: 'core/pattern-overrides' },
			},
		},
	};

	const makeSelect = ( attributes ) => () => ( {
		getBlockAttributes: () => attributes,
	} );

	describe( 'getValues', () => {
		it( 'returns the current attribute value when there is no override', () => {
			const values = patternOverridesBindings.getValues( {
				select: makeSelect( blockAttributes ),
				clientId: 'block-1',
				context: {},
				bindings: {
					content: { source: 'core/pattern-overrides' },
				},
			} );

			expect( values ).toEqual( { content: 'original content' } );
		} );

		it( 'returns the override value when the context provides one', () => {
			const values = patternOverridesBindings.getValues( {
				select: makeSelect( blockAttributes ),
				clientId: 'block-1',
				context: {
					'pattern/overrides': {
						'Editable Paragraph': { content: 'overridden' },
					},
				},
				bindings: {
					content: { source: 'core/pattern-overrides' },
				},
			} );

			expect( values ).toEqual( { content: 'overridden' } );
		} );

		it( 'does not throw when block attributes are unavailable', () => {
			expect( () =>
				patternOverridesBindings.getValues( {
					select: makeSelect( null ),
					clientId: 'missing-client-id',
					context: {},
					bindings: {
						__default: { source: 'core/pattern-overrides' },
					},
				} )
			).not.toThrow();
		} );

		describe( 'inner blocks', () => {
			const hostAttributes = {
				metadata: {
					name: 'Area',
					bindings: { innerBlocks: PATTERN_OVERRIDES_BINDING },
				},
			};
			const getInnerBlocksValues = ( attributes, overrides ) =>
				patternOverridesBindings.getValues( {
					select: makeSelect( attributes ),
					clientId: 'block-1',
					context: { 'pattern/overrides': overrides },
					bindings: { innerBlocks: PATTERN_OVERRIDES_BINDING },
				} );

			it( 'returns the overridden inner blocks', () => {
				const innerBlocks =
					'<!-- wp:paragraph --><p>Override</p><!-- /wp:paragraph -->';

				expect(
					getInnerBlocksValues( hostAttributes, {
						Area: { innerBlocks },
					} )
				).toEqual( { innerBlocks } );
			} );

			it( 'keeps inner blocks overridden as empty, unlike a cleared attribute', () => {
				const values = patternOverridesBindings.getValues( {
					select: makeSelect( {
						content: 'original content',
						metadata: { name: 'Area' },
					} ),
					clientId: 'block-1',
					context: {
						'pattern/overrides': {
							Area: { content: '', innerBlocks: '' },
						},
					},
					bindings: {
						content: PATTERN_OVERRIDES_BINDING,
						innerBlocks: PATTERN_OVERRIDES_BINDING,
					},
				} );

				expect( values ).toEqual( {
					content: undefined,
					innerBlocks: '',
				} );
			} );

			it( 'returns no inner blocks when they are not overridden', () => {
				const values = getInnerBlocksValues(
					// An attribute with the same name is not the inner blocks.
					{ ...hostAttributes, innerBlocks: 'attribute value' },
					{ Area: { content: 'overridden' } }
				);

				expect( values ).toEqual( { innerBlocks: undefined } );
			} );

			it( 'returns no inner blocks for an override that is not a string', () => {
				expect(
					getInnerBlocksValues( hostAttributes, {
						Area: { innerBlocks: [] },
					} )
				).toEqual( { innerBlocks: undefined } );
			} );
		} );
	} );

	describe( 'setValues', () => {
		beforeAll( () => {
			registerBlockType(
				{ name: paragraphBlock.name, ...paragraphBlock.metadata },
				paragraphBlock.settings
			);
			registerBlockType(
				{ name: groupBlock.name, ...groupBlock.metadata },
				groupBlock.settings
			);
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
		} );

		afterAll( () => {
			unregisterBlockType( 'core/paragraph' );
			unregisterBlockType( 'core/group' );
			unregisterBlockType( 'core/block' );
		} );

		function createRegistryWithBlocks( blocks ) {
			const registry = createRegistry();
			registry.register( blockEditorStore );
			registry.dispatch( blockEditorStore ).resetBlocks( blocks );
			return registry;
		}

		function setValues( registry, clientId, bindings ) {
			patternOverridesBindings.setValues( {
				select: registry.select,
				dispatch: registry.dispatch,
				clientId,
				bindings,
			} );
		}

		function createPatternWithArea( content ) {
			const area = createBlock(
				'core/group',
				{
					metadata: {
						name: 'Area',
						bindings: { innerBlocks: PATTERN_OVERRIDES_BINDING },
					},
				},
				[ createBlock( 'core/paragraph', { content: 'Default' } ) ]
			);
			const pattern = createBlock( 'core/block', { ref: 1, content }, [
				area,
			] );
			return { area, pattern };
		}

		const getContent = ( registry, pattern ) =>
			registry
				.select( blockEditorStore )
				.getBlockAttributes( pattern.clientId ).content;

		it( 'stores the inner blocks in the pattern instance', () => {
			const { area, pattern } = createPatternWithArea( {
				Title: { content: 'Overridden' },
			} );
			const registry = createRegistryWithBlocks( [ pattern ] );
			const innerBlocks = serialize( [
				createBlock( 'core/paragraph', { content: 'Override' } ),
			] );

			setValues( registry, area.clientId, {
				innerBlocks: { newValue: innerBlocks },
			} );

			expect( getContent( registry, pattern ) ).toEqual( {
				Title: { content: 'Overridden' },
				Area: { innerBlocks },
			} );
		} );

		it( 'stores emptied inner blocks as an empty string', () => {
			const { area, pattern } = createPatternWithArea();
			const registry = createRegistryWithBlocks( [ pattern ] );

			setValues( registry, area.clientId, {
				innerBlocks: { newValue: '' },
			} );

			expect( getContent( registry, pattern ) ).toEqual( {
				Area: { innerBlocks: '' },
			} );
		} );

		it( 'does not store inner blocks that are not serialized', () => {
			const innerBlocks = serialize( [
				createBlock( 'core/paragraph', { content: 'Override' } ),
			] );
			const { area, pattern } = createPatternWithArea( {
				Area: { innerBlocks },
			} );
			const registry = createRegistryWithBlocks( [ pattern ] );

			setValues( registry, area.clientId, {
				innerBlocks: { newValue: undefined },
			} );

			expect( getContent( registry, pattern ) ).toEqual( {
				Area: { innerBlocks },
			} );
		} );

		it( 'stores the inner blocks as written, with the bindings of the blocks inside them', () => {
			const { area, pattern } = createPatternWithArea( {
				Title: { content: 'Overridden' },
			} );
			const registry = createRegistryWithBlocks( [ pattern ] );
			const innerBlocks = serialize( [
				createBlock( 'core/paragraph', {
					content: 'Default',
					metadata: {
						name: 'Title',
						bindings: { __default: PATTERN_OVERRIDES_BINDING },
					},
				} ),
			] );

			setValues( registry, area.clientId, {
				innerBlocks: { newValue: innerBlocks },
			} );

			expect( getContent( registry, pattern ) ).toEqual( {
				Title: { content: 'Overridden' },
				Area: { innerBlocks },
			} );
			// The editor reads back what it wrote.
			expect(
				patternOverridesBindings.getValues( {
					select: registry.select,
					clientId: area.clientId,
					context: {
						'pattern/overrides': getContent( registry, pattern ),
					},
					bindings: { innerBlocks: PATTERN_OVERRIDES_BINDING },
				} )
			).toEqual( { innerBlocks } );
		} );

		it( 'stores cleared attributes as an empty string', () => {
			const paragraph = createBlock( 'core/paragraph', {
				content: 'Default',
				metadata: {
					name: 'Title',
					bindings: { __default: PATTERN_OVERRIDES_BINDING },
				},
			} );
			const pattern = createBlock( 'core/block', { ref: 1 }, [
				paragraph,
			] );
			const registry = createRegistryWithBlocks( [ pattern ] );

			setValues( registry, paragraph.clientId, {
				content: { newValue: undefined },
			} );

			expect( getContent( registry, pattern ) ).toEqual( {
				Title: { content: '' },
			} );
		} );

		describe( 'outside a pattern instance', () => {
			it( 'syncs the attributes of the blocks with the same name', () => {
				const paragraphs = [ 'First', 'Second' ].map( ( content ) =>
					createBlock( 'core/paragraph', {
						content,
						metadata: {
							name: 'Title',
							bindings: {
								__default: PATTERN_OVERRIDES_BINDING,
							},
						},
					} )
				);
				const registry = createRegistryWithBlocks( paragraphs );

				setValues( registry, paragraphs[ 0 ].clientId, {
					content: { newValue: 'Synced' },
				} );

				expect(
					registry
						.select( blockEditorStore )
						.getBlocks()
						.map( ( block ) => block.attributes.content )
				).toEqual( [ 'Synced', 'Synced' ] );
			} );

			it( 'does not sync the inner blocks of the blocks with the same name', () => {
				const areas = [ 'First', 'Second' ].map( ( content ) =>
					createBlock(
						'core/group',
						{
							metadata: {
								name: 'Area',
								bindings: {
									innerBlocks: PATTERN_OVERRIDES_BINDING,
								},
							},
						},
						[ createBlock( 'core/paragraph', { content } ) ]
					)
				);
				const registry = createRegistryWithBlocks( areas );
				const blocksBefore = registry
					.select( blockEditorStore )
					.getBlocks();

				setValues( registry, areas[ 0 ].clientId, {
					innerBlocks: {
						newValue: serialize( [
							createBlock( 'core/paragraph', {
								content: 'Override',
							} ),
						] ),
					},
				} );

				expect( registry.select( blockEditorStore ).getBlocks() ).toBe(
					blocksBefore
				);
			} );
		} );
	} );

	describe( 'canUserEditValue', () => {
		const canUserEditValue = ( attributes, clientId ) =>
			patternOverridesBindings.canUserEditValue( {
				select: makeSelect( attributes ),
				context: {},
				clientId,
			} );

		it( 'lets the user edit attributes, which are checked without a client ID', () => {
			expect( canUserEditValue( blockAttributes ) ).toBe( true );
			expect(
				canUserEditValue( {
					content: 'original content',
					metadata: {
						bindings: { content: PATTERN_OVERRIDES_BINDING },
					},
				} )
			).toBe( true );
		} );

		it( 'lets the user edit the inner blocks of a named block', () => {
			expect(
				canUserEditValue(
					{
						metadata: {
							name: 'Area',
							bindings: {
								innerBlocks: PATTERN_OVERRIDES_BINDING,
							},
						},
					},
					'block-1'
				)
			).toBe( true );
		} );

		it( 'does not let the user edit the inner blocks of a block without a name', () => {
			expect(
				canUserEditValue(
					{
						metadata: {
							bindings: {
								innerBlocks: PATTERN_OVERRIDES_BINDING,
							},
						},
					},
					'block-1'
				)
			).toBe( false );
		} );
	} );
} );
