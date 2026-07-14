/**
 * Internal dependencies
 */
import hasOverridablePatternBlocks from '../has-overridable-pattern-blocks';

const getBinding = ( attributes, blockName ) =>
	blockName === 'core/html'
		? undefined
		: attributes?.metadata?.bindings?.innerBlocks;

describe( 'hasOverridablePatternBlocks', () => {
	const structuralBlock = {
		name: 'core/group',
		attributes: {
			metadata: {
				name: 'Free area',
				bindings: {
					innerBlocks: { source: 'core/pattern-overrides' },
				},
			},
		},
		innerBlocks: [],
	};
	const options = {
		innerBlocks: true,
		getBinding,
		isOverridable: () => false,
		supportedTypes: [],
	};

	it( 'finds a structural-only pattern override', () => {
		expect(
			hasOverridablePatternBlocks( [ structuralBlock ], options )
		).toBe( true );
	} );

	it( 'keeps structural detection inert without the plugin setting', () => {
		expect(
			hasOverridablePatternBlocks( [ structuralBlock ], {
				...options,
				innerBlocks: false,
			} )
		).toBe( false );
	} );

	it( 'preserves attribute-based detection without the plugin setting', () => {
		expect(
			hasOverridablePatternBlocks(
				[
					{
						name: 'core/paragraph',
						attributes: {},
						innerBlocks: [],
					},
				],
				{
					...options,
					innerBlocks: false,
					isOverridable: () => true,
					supportedTypes: [ 'core/paragraph' ],
				}
			)
		).toBe( true );
	} );

	it.each( [
		[ 'another source', 'plugin/custom-source', 'Free area', 'core/group' ],
		[
			'an unnamed area',
			'core/pattern-overrides',
			undefined,
			'core/group',
		],
		[ 'core/html', 'core/pattern-overrides', 'Free area', 'core/html' ],
	] )( 'ignores %s', ( _label, source, name, blockName ) => {
		expect(
			hasOverridablePatternBlocks(
				[
					{
						...structuralBlock,
						name: blockName,
						attributes: {
							metadata: {
								name,
								bindings: {
									innerBlocks: { source },
								},
							},
						},
					},
				],
				options
			)
		).toBe( false );
	} );

	it( 'finds structural bindings nested in the pattern', () => {
		expect(
			hasOverridablePatternBlocks(
				[
					{
						name: 'core/group',
						attributes: {},
						innerBlocks: [ structuralBlock ],
					},
				],
				options
			)
		).toBe( true );
	} );
} );
