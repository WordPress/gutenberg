/**
 * Internal dependencies
 */
import patternOverridesBindings from '../pattern-overrides';

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

	const makeSelect =
		( attributes, settings = {} ) =>
		() => ( {
			getBlockAttributes: () => attributes,
			getSettings: () => settings,
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

		it( 'keeps the existing empty-string sentinel for attributes', () => {
			const values = patternOverridesBindings.getValues( {
				select: makeSelect( blockAttributes, {
					blockBindingsInnerBlocks: true,
				} ),
				clientId: 'block-1',
				context: {
					'pattern/overrides': {
						'Editable Paragraph': { content: '' },
					},
				},
				bindings: {
					content: { source: 'core/pattern-overrides' },
				},
			} );

			expect( values ).toEqual( { content: undefined } );
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

		it( 'keeps an empty structural override as an intentional value', () => {
			const values = patternOverridesBindings.getValues( {
				select: makeSelect( blockAttributes, {
					blockBindingsInnerBlocks: true,
				} ),
				clientId: 'block-1',
				context: {
					'pattern/overrides': {
						'Editable Paragraph': { innerBlocks: '' },
					},
				},
				bindings: {
					innerBlocks: { source: 'core/pattern-overrides' },
				},
			} );

			expect( values ).toEqual( { innerBlocks: '' } );
		} );

		it( 'returns structural absence instead of looking for an attribute fallback', () => {
			const values = patternOverridesBindings.getValues( {
				select: makeSelect(
					{
						...blockAttributes,
						innerBlocks: 'not structural children',
					},
					{ blockBindingsInnerBlocks: true }
				),
				clientId: 'block-1',
				context: {},
				bindings: {
					innerBlocks: { source: 'core/pattern-overrides' },
				},
			} );

			expect( values ).toEqual( { innerBlocks: undefined } );
		} );
	} );

	describe( 'setValues', () => {
		const makeSetValuesSelect =
			( {
				patternClientId = 'pattern-1',
				patternContent = {},
				settings = { blockBindingsInnerBlocks: true },
				blocks = [],
			} = {} ) =>
			() => ( {
				getBlockAttributes: ( clientId ) =>
					clientId === 'block-1'
						? blockAttributes
						: { content: patternContent },
				getBlockParentsByBlockName: () =>
					patternClientId ? [ patternClientId ] : [],
				getBlocks: () => blocks,
				getSettings: () => settings,
			} );

		it( 'stores serialized inner blocks on the pattern instance', () => {
			const updateBlockAttributes = jest.fn();
			const markup =
				'<!-- wp:paragraph --><p>Override</p><!-- /wp:paragraph -->';

			patternOverridesBindings.setValues( {
				select: makeSetValuesSelect( {
					patternContent: {
						'Editable Paragraph': { content: 'Existing' },
					},
				} ),
				dispatch: () => ( { updateBlockAttributes } ),
				clientId: 'block-1',
				bindings: { innerBlocks: { newValue: markup } },
			} );

			expect( updateBlockAttributes ).toHaveBeenCalledWith( 'pattern-1', {
				content: {
					'Editable Paragraph': {
						content: 'Existing',
						innerBlocks: markup,
					},
				},
			} );
		} );

		it( 'keeps an intentionally empty structural value when writing', () => {
			const updateBlockAttributes = jest.fn();

			patternOverridesBindings.setValues( {
				select: makeSetValuesSelect(),
				dispatch: () => ( { updateBlockAttributes } ),
				clientId: 'block-1',
				bindings: { innerBlocks: { newValue: '' } },
			} );

			expect( updateBlockAttributes ).toHaveBeenCalledWith( 'pattern-1', {
				content: {
					'Editable Paragraph': { innerBlocks: '' },
				},
			} );
		} );

		it( 'does not treat inner blocks as an attribute outside a pattern instance', () => {
			const updateBlockAttributes = jest.fn();

			patternOverridesBindings.setValues( {
				select: makeSetValuesSelect( {
					patternClientId: null,
					blocks: [
						{
							clientId: 'matching-block',
							attributes: blockAttributes,
							innerBlocks: [],
						},
					],
				} ),
				dispatch: () => ( { updateBlockAttributes } ),
				clientId: 'block-1',
				bindings: {
					content: { newValue: 'Updated' },
					innerBlocks: { newValue: '<!-- wp:paragraph /-->' },
				},
			} );

			expect( updateBlockAttributes ).toHaveBeenCalledTimes( 1 );
			expect( updateBlockAttributes ).toHaveBeenCalledWith(
				'matching-block',
				{ content: 'Updated' }
			);
		} );

		it( 'does nothing for a structural-only write outside a pattern instance', () => {
			const updateBlockAttributes = jest.fn();

			patternOverridesBindings.setValues( {
				select: makeSetValuesSelect( {
					patternClientId: null,
					blocks: [
						{
							clientId: 'matching-block',
							attributes: blockAttributes,
							innerBlocks: [],
						},
					],
				} ),
				dispatch: () => ( { updateBlockAttributes } ),
				clientId: 'block-1',
				bindings: {
					innerBlocks: { newValue: '<!-- wp:paragraph /-->' },
				},
			} );

			expect( updateBlockAttributes ).not.toHaveBeenCalled();
		} );
	} );
} );
