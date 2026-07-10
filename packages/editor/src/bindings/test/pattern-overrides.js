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
} );
