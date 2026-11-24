import { describe, expect, it } from 'vitest';
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
		it( 'copies an explicit empty override instead of restoring the saved fallback', () => {
			const options = {
				select: makeSelect( blockAttributes ),
				clientId: 'block-1',
				context: {
					'pattern/overrides': {
						'Editable Paragraph': { content: '' },
					},
				},
				bindings: { content: { source: 'core/pattern-overrides' } },
			};

			expect( patternOverridesBindings.getValues( options ) ).toEqual( {
				content: undefined,
			} );
			expect(
				patternOverridesBindings.getValues( {
					...options,
					isForCopy: true,
				} )
			).toEqual( { content: '' } );
		} );

		it.each( [ 'Overridden content', 0, false, null ] )(
			'copies the genuine override %s',
			( value ) => {
				const options = {
					select: makeSelect( blockAttributes ),
					clientId: 'block-1',
					context: {
						'pattern/overrides': {
							'Editable Paragraph': { content: value },
						},
					},
					bindings: { content: { source: 'core/pattern-overrides' } },
					isForCopy: true,
				};

				expect( patternOverridesBindings.getValues( options ) ).toEqual(
					{
						content: value,
					}
				);
			}
		);

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
	} );
} );
