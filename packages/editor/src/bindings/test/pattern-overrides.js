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

		it( 'uses the provided client ID when block attributes are unavailable', () => {
			const getBlockAttributes = jest.fn( () => null );
			const select = () => ( { getBlockAttributes } );
			const values = patternOverridesBindings.getValues( {
				select,
				clientId: 'missing-client-id',
				context: {},
				bindings: {
					content: { source: 'core/pattern-overrides' },
				},
			} );

			expect( values ).toEqual( { content: undefined } );
			expect( getBlockAttributes ).toHaveBeenCalledWith(
				'missing-client-id'
			);
		} );
	} );
} );
