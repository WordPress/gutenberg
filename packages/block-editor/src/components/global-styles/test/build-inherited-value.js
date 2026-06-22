/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	buildInheritedValue,
	buildInheritedValueMemoized,
	buildInheritedValueWithSources,
	buildInheritedValueWithSourcesMemoized,
	__unstable,
} from '../build-inherited-value';
import {
	getCommonInheritanceTooltipText,
	getInheritanceTooltipText,
} from '../inheritance';
import {
	InheritedValueProvider,
	useInheritedValue,
} from '../inherited-value-context';

import { globalStylesDataKey } from '../../../store/private-keys';
const {
	isExplicitEmpty,
	isRefObject,
	pickLayerRootContribution,
	pickLayerElementContribution,
	deepMergeDroppingEmpties,
} = __unstable;

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn( () => ( {} ) ),
	useRegistry: jest.fn( () => ( {} ) ),
	createSelector: jest.fn( ( callback ) => callback ),
	createReduxStore: jest.fn(),
	createRegistry: jest.fn(),
	register: jest.fn(),
	select: jest.fn(),
	dispatch: jest.fn(),
	combineReducers: jest.fn( ( reducers ) => reducers ),
	subscribe: jest.fn(),
	RegistryProvider: ( { children } ) => children,
	RegistryConsumer: ( { children } ) => children( {} ),
	AsyncModeProvider: ( { children } ) => children,
	useRegistrySelect: jest.fn(),
	useRegistryDispatch: jest.fn( () => ( {} ) ),
	withSelect: ( mapStateToProps ) => ( Component ) => ( props ) =>
		Component( {
			...props,
			...( mapStateToProps?.( () => ( {} ) ) || {} ),
		} ),
	withDispatch: () => ( Component ) => ( props ) => Component( props ),
	withRegistry: ( Component ) => Component,
} ) );

jest.mock( '../../../store', () => ( {
	store: { name: 'core/block-editor' },
} ) );

// `inherited-value-context.js` imports `store as blocksStore` from
// `@wordpress/blocks` for `useOwnVariation`. The blocks store's transitive
// import chain fails under this file's `@wordpress/data` mock (missing
// `createSelector`), so stub the blocks module with just the shape needed.
jest.mock( '@wordpress/blocks', () => ( {
	store: { name: 'core/blocks' },
	getBlockType: ( blockName ) =>
		( {
			'core/group': { title: 'Group' },
			'core/heading': { title: 'Heading' },
			'core/paragraph': { title: 'Paragraph' },
		} )[ blockName ],
} ) );

// Short-circuit the variation-ref resolution path; ref handling is covered
// by dedicated builder tests.
jest.mock( '../../../hooks/block-style-variation', () => ( {
	getVariationStylesWithRefValues: ( gs, blockName, variation ) =>
		gs?.styles?.blocks?.[ blockName ]?.variations?.[ variation ] ?? null,
} ) );
describe( 'buildInheritedValue – pure builder', () => {
	describe( 'internals', () => {
		test( 'isExplicitEmpty drops "", null, {} only', () => {
			expect( isExplicitEmpty( '' ) ).toBe( true );
			expect( isExplicitEmpty( null ) ).toBe( true );
			expect( isExplicitEmpty( {} ) ).toBe( true );
			expect( isExplicitEmpty( 0 ) ).toBe( false );
			expect( isExplicitEmpty( '0' ) ).toBe( false );
			expect( isExplicitEmpty( false ) ).toBe( false );
			expect( isExplicitEmpty( NaN ) ).toBe( false );
			expect( isExplicitEmpty( undefined ) ).toBe( false );
			expect( isExplicitEmpty( [] ) ).toBe( false );
			expect( isExplicitEmpty( { a: 1 } ) ).toBe( false );
		} );

		test( 'isRefObject recognises { ref: "..." } envelopes', () => {
			expect( isRefObject( { ref: 'styles.color.text' } ) ).toBe( true );
			expect( isRefObject( { ref: '' } ) ).toBe( true );
			expect( isRefObject( { ref: 42 } ) ).toBe( false );
			expect( isRefObject( null ) ).toBe( false );
			expect( isRefObject( 'var:preset|color|red' ) ).toBe( false );
		} );

		test( 'pickLayerElementContribution folds element-tag branch', () => {
			const layer = {
				typography: { lineHeight: '1.2' },
				elements: {
					h2: { typography: { fontSize: '32px' } },
				},
			};
			const out = pickLayerElementContribution( layer, 'h2' );
			expect( out ).toEqual( {
				typography: { fontSize: '32px' },
			} );
		} );

		test( 'pickLayerRootContribution preserves elements sub-tree passthrough', () => {
			const layer = {
				typography: { lineHeight: '1.2' },
				elements: {
					h2: { typography: { fontSize: '32px' } },
				},
			};
			const out = pickLayerRootContribution( layer );
			expect( out.typography ).toEqual( { lineHeight: '1.2' } );
			expect( out.elements ).toBe( layer.elements );
		} );

		test( 'pickLayerRootContribution returns null for empty layers', () => {
			expect( pickLayerRootContribution( null ) ).toBeNull();
			expect( pickLayerRootContribution( {} ) ).toBeNull();
			expect( pickLayerRootContribution( [] ) ).toBeNull();
		} );

		test( 'pickLayerElementContribution returns null when no element present', () => {
			expect(
				pickLayerElementContribution(
					{ typography: { lineHeight: '1.2' } },
					'h2'
				)
			).toBeNull();
			expect( pickLayerElementContribution( null, 'h2' ) ).toBeNull();
			expect( pickLayerElementContribution( {}, null ) ).toBeNull();
		} );

		test( 'deepMergeDroppingEmpties resolves refs inline', () => {
			const gs = {
				styles: {
					color: { text: '#cf2e2e' },
				},
			};
			const target = {};
			const source = { color: { text: { ref: 'styles.color.text' } } };
			const out = deepMergeDroppingEmpties( target, source, gs );
			expect( out ).toEqual( { color: { text: '#cf2e2e' } } );
		} );

		test( 'deepMergeDroppingEmpties skips invalid refs', () => {
			const gs = { styles: {} };
			const out = deepMergeDroppingEmpties(
				{ color: { text: '#000' } },
				{ color: { text: { ref: '   ' } } },
				gs
			);
			expect( out ).toEqual( { color: { text: '#000' } } );
		} );

		test( 'deepMergeDroppingEmpties drops explicit-empty source leaves', () => {
			const out = deepMergeDroppingEmpties(
				{ typography: { fontSize: '32px', lineHeight: '1.2' } },
				{ typography: { fontSize: '', lineHeight: null } },
				{}
			);
			expect( out ).toEqual( {
				typography: { fontSize: '32px', lineHeight: '1.2' },
			} );
		} );
	} );

	describe( 'layer precedence', () => {
		const gs = {
			styles: {
				typography: { fontSize: '16px', lineHeight: '1.5' },
				elements: {
					h2: { typography: { fontSize: '24px' } },
				},
				blocks: {
					'core/heading': {
						typography: { fontSize: '28px' },
						elements: {
							h2: { typography: { fontSize: '32px' } },
						},
						variations: {
							plain: {
								typography: {
									fontSize: '20px',
									lineHeight: '1.1',
								},
							},
						},
					},
				},
			},
		};

		test( 'root only (layer 1)', () => {
			const out = buildInheritedValue( {
				blockName: 'core/paragraph',
				globalStyles: gs,
			} );
			expect( out.typography.fontSize ).toBe( '16px' );
			expect( out.typography.lineHeight ).toBe( '1.5' );
		} );

		test( 'element layer (layer 2) overrides root for shared leaf', () => {
			const out = buildInheritedValue( {
				blockName: 'core/paragraph',
				element: 'h2',
				globalStyles: gs,
			} );
			expect( out.typography.fontSize ).toBe( '24px' );
			expect( out.typography.lineHeight ).toBe( '1.5' );
		} );

		test( 'block-default (layer 3) overrides element + root', () => {
			const out = buildInheritedValue( {
				blockName: 'core/heading',
				globalStyles: gs,
			} );
			expect( out.typography.fontSize ).toBe( '28px' );
			expect( out.typography.lineHeight ).toBe( '1.5' );
		} );

		test( "block-element (layer 3') overrides block-default", () => {
			const out = buildInheritedValue( {
				blockName: 'core/heading',
				element: 'h2',
				globalStyles: gs,
			} );
			expect( out.typography.fontSize ).toBe( '32px' );
		} );

		test( 'own-variation (layer 4b) wins', () => {
			const out = buildInheritedValue( {
				blockName: 'core/heading',
				ownVariation: 'plain',
				globalStyles: gs,
			} );
			expect( out.typography.fontSize ).toBe( '20px' );
			expect( out.typography.lineHeight ).toBe( '1.1' );
		} );
	} );

	describe( 'state-aware inheritance (selectedState)', () => {
		const DEFAULT_STATE = { viewport: 'default', pseudo: 'default' };
		const HOVER_STATE = { viewport: 'default', pseudo: ':hover' };
		const MOBILE_STATE = { viewport: '@mobile', pseudo: 'default' };

		// Button-style block with base + `:hover` slices at the root element,
		// block, and block-element layers, plus a base-only leaf (fontSize).
		const gs = {
			styles: {
				color: { text: 'rootText' },
				elements: {
					button: {
						color: { text: 'elBtnBase' },
						':hover': { color: { text: 'elBtnHover' } },
					},
				},
				blocks: {
					'core/button': {
						color: { text: 'buttonBase' },
						typography: { fontSize: '13px' },
						':hover': { color: { text: 'buttonHover' } },
					},
				},
			},
		};

		test( 'no selectedState behaves as the default state (base value)', () => {
			const out = buildInheritedValue( {
				blockName: 'core/button',
				element: 'button',
				globalStyles: gs,
			} );
			expect( out.color.text ).toBe( 'buttonBase' );
		} );

		test( 'explicit default selectedState is identical to base', () => {
			const out = buildInheritedValue( {
				blockName: 'core/button',
				element: 'button',
				globalStyles: gs,
				selectedState: DEFAULT_STATE,
			} );
			expect( out.color.text ).toBe( 'buttonBase' );
		} );

		test( 'pseudo state layers the block `:hover` slice over base', () => {
			const out = buildInheritedValue( {
				blockName: 'core/button',
				element: 'button',
				globalStyles: gs,
				selectedState: HOVER_STATE,
			} );
			// Block-level `:hover` (higher scope) wins over the element-level
			// `:hover`, and both win over the base color.
			expect( out.color.text ).toBe( 'buttonHover' );
		} );

		test( 'pseudo state element slice applies when no block-level state exists', () => {
			const elementOnly = {
				styles: {
					elements: {
						button: {
							color: { text: 'elBtnBase' },
							':hover': { color: { text: 'elBtnHover' } },
						},
					},
					blocks: {
						'core/button': { color: { text: 'buttonBase' } },
					},
				},
			};
			const out = buildInheritedValue( {
				blockName: 'core/button',
				element: 'button',
				globalStyles: elementOnly,
				selectedState: HOVER_STATE,
			} );
			expect( out.color.text ).toBe( 'elBtnHover' );
		} );

		test( 'base-only leaves still inherit under a selected state (CSS cascade)', () => {
			const out = buildInheritedValue( {
				blockName: 'core/button',
				element: 'button',
				globalStyles: gs,
				selectedState: HOVER_STATE,
			} );
			// fontSize has no `:hover` override → cascades from the base.
			expect( out.typography.fontSize ).toBe( '13px' );
		} );

		test( 'responsive state with no Global Styles slice falls back to base', () => {
			const out = buildInheritedValue( {
				blockName: 'core/button',
				element: 'button',
				globalStyles: gs,
				selectedState: MOBILE_STATE,
			} );
			// Global Styles carries no responsive sub-tree, so mobile inherits
			// the base value unchanged.
			expect( out.color.text ).toBe( 'buttonBase' );
			expect( out.typography.fontSize ).toBe( '13px' );
		} );

		test( 'responsive state layers the block `@mobile` slice over base', () => {
			// Block-style block with a populated `@mobile` slice that overrides
			// the base color, plus a base-only leaf (fontSize).
			const responsiveGs = {
				styles: {
					blocks: {
						'core/button': {
							color: { text: 'buttonBase' },
							typography: { fontSize: '13px' },
							'@mobile': { color: { text: 'buttonMobile' } },
						},
					},
				},
			};
			const out = buildInheritedValue( {
				blockName: 'core/button',
				element: 'button',
				globalStyles: responsiveGs,
				selectedState: MOBILE_STATE,
			} );
			// The `@mobile` slice wins over the base color...
			expect( out.color.text ).toBe( 'buttonMobile' );
			// ...while base-only leaves cascade from the base (no `@mobile`
			// override for fontSize).
			expect( out.typography.fontSize ).toBe( '13px' );
		} );

		test( 'source map attributes a state-won leaf to its originating layer', () => {
			const { value, sources } = buildInheritedValueWithSources( {
				blockName: 'core/button',
				element: 'button',
				globalStyles: gs,
				selectedState: HOVER_STATE,
			} );
			expect( value.color.text ).toBe( 'buttonHover' );
			expect( sources[ 'color.text' ]?.layer ).toBe( 'block' );
		} );

		test( 'memoized variant keys distinct states separately', () => {
			const base = buildInheritedValueMemoized( {
				blockName: 'core/button',
				element: 'button',
				globalStyles: gs,
				selectedState: DEFAULT_STATE,
			} );
			const hover = buildInheritedValueMemoized( {
				blockName: 'core/button',
				element: 'button',
				globalStyles: gs,
				selectedState: HOVER_STATE,
			} );
			expect( base.color.text ).toBe( 'buttonBase' );
			expect( hover.color.text ).toBe( 'buttonHover' );
		} );
	} );

	describe( 'explicit-empty normalization', () => {
		test( 'empty leaf at block layer lets root win', () => {
			const gs = {
				styles: {
					typography: { fontSize: '16px' },
					blocks: {
						'core/heading': {
							typography: { fontSize: '' },
						},
					},
				},
			};
			const out = buildInheritedValue( {
				blockName: 'core/heading',
				globalStyles: gs,
			} );
			expect( out.typography.fontSize ).toBe( '16px' );
		} );

		test( 'zero-valued leaf is NOT empty', () => {
			const gs = {
				styles: {
					spacing: { padding: { top: '0' } },
				},
			};
			const out = buildInheritedValue( {
				blockName: 'core/group',
				globalStyles: gs,
			} );
			expect( out.spacing.padding.top ).toBe( '0' );
		} );
	} );

	describe( 'hydration + edge cases', () => {
		test( 'falsy globalStyles returns {}', () => {
			expect(
				buildInheritedValue( {
					blockName: 'core/heading',
					globalStyles: null,
				} )
			).toEqual( {} );
			expect(
				buildInheritedValue( {
					blockName: 'core/heading',
					globalStyles: {},
				} )
			).toEqual( {} );
		} );

		test( 'missing blockName returns {}', () => {
			expect(
				buildInheritedValue( {
					globalStyles: {
						styles: { typography: { fontSize: '16px' } },
					},
				} )
			).toEqual( {} );
		} );

		test( 'unknown block still inherits from root', () => {
			const gs = { styles: { typography: { fontSize: '16px' } } };
			const out = buildInheritedValue( {
				blockName: 'core/does-not-exist',
				globalStyles: gs,
			} );
			expect( out.typography.fontSize ).toBe( '16px' );
		} );
	} );

	describe( 'preset passthrough', () => {
		test( 'var:preset| strings are preserved raw for panels to decode', () => {
			const gs = {
				styles: {
					color: { text: 'var:preset|color|vivid-red' },
				},
			};
			const out = buildInheritedValue( {
				blockName: 'core/paragraph',
				globalStyles: gs,
			} );
			expect( out.color.text ).toBe( 'var:preset|color|vivid-red' );
		} );

		test( 'var(--wp--preset--...) strings are preserved raw', () => {
			const gs = {
				styles: {
					color: { text: 'var(--wp--preset--color--vivid-red)' },
				},
			};
			const out = buildInheritedValue( {
				blockName: 'core/paragraph',
				globalStyles: gs,
			} );
			expect( out.color.text ).toBe(
				'var(--wp--preset--color--vivid-red)'
			);
		} );
	} );

	describe( 'shape contract', () => {
		test( 'tree-structural keys are stripped from root contribution', () => {
			const gs = {
				styles: {
					typography: { fontSize: '16px' },
					blocks: {
						'core/heading': { typography: { fontSize: '28px' } },
					},
					css: ':root { --x: 1; }',
				},
			};
			const out = buildInheritedValue( {
				blockName: 'core/heading',
				globalStyles: gs,
			} );
			expect( out ).not.toHaveProperty( 'blocks' );
			expect( out ).not.toHaveProperty( 'variations' );
			expect( out ).not.toHaveProperty( 'css' );
		} );

		test( 'elements sub-tree is preserved for block-scoped element reads', () => {
			const gs = {
				styles: {
					elements: {
						link: { color: { text: '#0073aa' } },
					},
				},
			};
			const out = buildInheritedValue( {
				blockName: 'core/paragraph',
				globalStyles: gs,
			} );
			expect( out.elements.link.color.text ).toBe( '#0073aa' );
		} );
	} );

	describe( 'tooltip formatting', () => {
		test( 'formats a source breadcrumb', () => {
			expect(
				getInheritanceTooltipText( {
					breadcrumb: [
						'styles',
						'blocks',
						'blockName',
						'variations',
						'variationName',
					],
					blockName: 'core/group',
					variation: 'subtitle',
					variationTitle: 'Subtitle',
				} )
			).toBe(
				'Default inherited from:\nStyles > Blocks > Group > Variations > Subtitle'
			);
		} );

		test( 'uses common source for compound controls when breadcrumbs match', () => {
			expect(
				getCommonInheritanceTooltipText(
					{
						'border.color': {
							breadcrumb: [ 'styles', 'blocks', 'blockName' ],
							blockName: 'core/group',
						},
						'border.width': {
							breadcrumb: [ 'styles', 'blocks', 'blockName' ],
							blockName: 'core/group',
						},
					},
					[ 'border.color', 'border.width' ]
				)
			).toBe( 'Default inherited from:\nStyles > Blocks > Group' );
		} );

		test( 'uses conservative text for mixed-source compound controls', () => {
			expect(
				getCommonInheritanceTooltipText(
					{
						'border.color': {
							breadcrumb: [ 'styles' ],
						},
						'border.width': {
							breadcrumb: [ 'styles', 'blocks', 'blockName' ],
							blockName: 'core/group',
						},
					},
					[ 'border.color', 'border.width' ]
				)
			).toBe( 'Default inherited from multiple Styles sources' );
		} );
	} );

	describe( 'source provenance', () => {
		const gs = {
			styles: {
				typography: { fontSize: '16px', lineHeight: '1.5' },
				color: { text: '#111111' },
				elements: {
					link: { color: { text: '#0073aa' } },
					h2: { typography: { fontSize: '24px' } },
				},
				blocks: {
					'core/heading': {
						typography: { fontSize: '28px' },
						elements: {
							h2: { typography: { fontSize: '32px' } },
						},
						variations: {
							plain: {
								typography: { fontSize: '20px' },
								elements: {
									h2: {
										typography: { fontSize: '18px' },
									},
								},
							},
						},
					},
				},
			},
		};

		test( 'returns value and source map from the same merge', () => {
			const { value, sources } = buildInheritedValueWithSources( {
				blockName: 'core/heading',
				ownVariation: 'plain',
				blockStyles: [ { name: 'plain', label: 'Plain' } ],
				globalStyles: gs,
			} );
			expect( value.typography.fontSize ).toBe( '20px' );
			expect( value.typography.lineHeight ).toBe( '1.5' );
			expect( sources[ 'typography.fontSize' ] ).toMatchObject( {
				breadcrumb: [
					'styles',
					'blocks',
					'blockName',
					'variations',
					'variationName',
				],
				layer: 'blockVariation',
				blockName: 'core/heading',
				variation: 'plain',
				variationTitle: 'Plain',
				path: [ 'typography', 'fontSize' ],
			} );
			expect( sources[ 'typography.lineHeight' ] ).toMatchObject( {
				breadcrumb: [ 'styles' ],
				layer: 'root',
			} );
		} );

		test( 'records element-folded winning source breadcrumbs', () => {
			const { value, sources } = buildInheritedValueWithSources( {
				blockName: 'core/heading',
				element: 'h2',
				ownVariation: 'plain',
				blockStyles: [ { name: 'plain', label: 'Plain' } ],
				globalStyles: gs,
			} );
			expect( value.typography.fontSize ).toBe( '18px' );
			expect( sources[ 'typography.fontSize' ] ).toMatchObject( {
				breadcrumb: [
					'styles',
					'blocks',
					'blockName',
					'variations',
					'variationName',
					'elements',
					'h2',
				],
				layer: 'blockVariationElement',
				variationTitle: 'Plain',
				element: 'h2',
			} );
		} );

		test( 'records preserved element sub-tree source paths', () => {
			const { sources } = buildInheritedValueWithSources( {
				blockName: 'core/paragraph',
				globalStyles: gs,
			} );
			expect( sources[ 'elements.link.color.text' ] ).toMatchObject( {
				breadcrumb: [ 'styles', 'elements', 'link' ],
				layer: 'root',
				path: [ 'elements', 'link', 'color', 'text' ],
			} );
		} );
	} );
} );

describe( 'buildInheritedValueMemoized – cache behaviour', () => {
	test( 'returns the same inheritance object identity for identical keys', () => {
		const gs = { styles: { typography: { fontSize: '16px' } } };
		const a = buildInheritedValueWithSourcesMemoized( {
			blockName: 'core/paragraph',
			globalStyles: gs,
		} );
		const b = buildInheritedValueWithSourcesMemoized( {
			blockName: 'core/paragraph',
			globalStyles: gs,
		} );
		expect( a ).toBe( b );
		expect( a.value.typography.fontSize ).toBe( '16px' );
		expect( a.sources[ 'typography.fontSize' ].breadcrumb ).toEqual( [
			'styles',
		] );
	} );

	test( 'value-only memoized helper preserves the previous return shape', () => {
		const gs = { styles: { typography: { fontSize: '16px' } } };
		const a = buildInheritedValueMemoized( {
			blockName: 'core/paragraph',
			globalStyles: gs,
		} );
		const b = buildInheritedValueMemoized( {
			blockName: 'core/paragraph',
			globalStyles: gs,
		} );
		expect( a ).toBe( b );
		expect( a.typography.fontSize ).toBe( '16px' );
	} );

	test( 'different composite key → different result', () => {
		const gs = {
			styles: {
				typography: { fontSize: '16px' },
				elements: { h2: { typography: { fontSize: '24px' } } },
			},
		};
		const a = buildInheritedValueMemoized( {
			blockName: 'core/heading',
			globalStyles: gs,
		} );
		const b = buildInheritedValueMemoized( {
			blockName: 'core/heading',
			element: 'h2',
			globalStyles: gs,
		} );
		expect( a.typography.fontSize ).toBe( '16px' );
		expect( b.typography.fontSize ).toBe( '24px' );
		expect( a ).not.toBe( b );
	} );

	test( 'different globalStyles reference → re-computed', () => {
		const gs1 = { styles: { typography: { fontSize: '16px' } } };
		const gs2 = { styles: { typography: { fontSize: '18px' } } };
		const a = buildInheritedValueMemoized( {
			blockName: 'core/paragraph',
			globalStyles: gs1,
		} );
		const b = buildInheritedValueMemoized( {
			blockName: 'core/paragraph',
			globalStyles: gs2,
		} );
		expect( a.typography.fontSize ).toBe( '16px' );
		expect( b.typography.fontSize ).toBe( '18px' );
		expect( a ).not.toBe( b );
	} );

	test( 'falsy globalStyles delegates to the pure builder', () => {
		const a = buildInheritedValueMemoized( {
			blockName: 'core/paragraph',
			globalStyles: null,
		} );
		expect( a ).toEqual( {} );
	} );
} );

describe( 'useInheritedValue / InheritedValueProvider', () => {
	beforeEach( () => {
		useSelect.mockReset();
	} );

	function Probe( { element } ) {
		const v = useInheritedValue( element ? { element } : undefined );
		return <div data-testid="probe">{ JSON.stringify( v ) }</div>;
	}

	test( 'without Provider, hook returns empty value and sources', () => {
		useSelect.mockReturnValue( null );
		render( <Probe /> );
		expect( screen.getByTestId( 'probe' ) ).toHaveTextContent(
			'{"value":{},"sources":{}}'
		);
	} );

	test( 'Provider issues exactly one useSelect subscription per mount', () => {
		// `globalStylesDataKey` holds the BARE merged styles tree in
		// production (see `editor/src/components/provider/
		// use-block-editor-settings.js:237`, `mergedGlobalStyles.styles`),
		// not the wrapped `{ settings, styles }` envelope. The Provider
		// wraps the bare tree before passing to the builder.
		const rawGlobalStyles = {
			typography: { fontSize: '16px' },
			elements: { h2: { typography: { fontSize: '24px' } } },
		};
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getSettings: () => ( {
					[ globalStylesDataKey ]: rawGlobalStyles,
				} ),
			} ) )
		);
		// Two panels under one Provider: the useSelect inside the
		// Provider runs once; the Probes consume context only.
		render(
			<InheritedValueProvider blockName="core/heading">
				<Probe element="h2" />
				<Probe />
			</InheritedValueProvider>
		);
		// One useSelect call from the Provider, none from the Probes.
		expect( useSelect ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'hook returns element-folded payload when element is supplied', () => {
		const rawGlobalStyles = {
			typography: { fontSize: '16px' },
			elements: { h2: { typography: { fontSize: '24px' } } },
		};
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getSettings: () => ( {
					[ globalStylesDataKey ]: rawGlobalStyles,
				} ),
			} ) )
		);
		render(
			<InheritedValueProvider blockName="core/heading">
				<Probe element="h2" />
			</InheritedValueProvider>
		);
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		expect( parsed.value.typography.fontSize ).toBe( '24px' );
		expect( parsed.sources[ 'typography.fontSize' ].breadcrumb ).toEqual( [
			'styles',
			'elements',
			'h2',
		] );
	} );

	test( 'hook returns { value, sources } during hydration', () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getSettings: () => ( {} ),
			} ) )
		);
		render(
			<InheritedValueProvider blockName="core/heading">
				<Probe />
			</InheritedValueProvider>
		);
		expect( screen.getByTestId( 'probe' ) ).toHaveTextContent(
			'{"value":{},"sources":{}}'
		);
	} );
} );

/**
 * Regression suite for the production data-shape contract.
 *
 * `settings[ globalStylesDataKey ]` carries the BARE merged Global
 * Styles tree — `{ typography: {...}, color: {...}, blocks: {...},
 * elements: {...}, ... }` — produced by
 * `editor/src/components/provider/use-block-editor-settings.js:237`
 * (`mergedGlobalStyles.styles`). It is NOT the wrapped
 * `{ settings, styles }` envelope.
 *
 * Pre-hot-fix, the Provider passed the bare tree directly to
 * `buildInheritedValue`, which destructures `const { styles } =
 * globalStyles` and so saw `undefined` and early-returned `{}`. Every
 * panel got an empty `inheritedValue`; nothing surfaced in the
 * inspector. None of the original suites caught it because their
 * fixtures all set `[ globalStylesDataKey ]: { styles: { ... } }` —
 * encoding the wrong shape assumption.
 *
 * This suite uses fixtures that mirror the production producer's
 * output and asserts the Provider → builder pipeline yields a
 * non-empty `inheritedValue` end-to-end. A future regression on the
 * data-shape contract — at the producer, the wrapping step inside the
 * Provider, or the builder's destructure — surfaces here in CI.
 */
describe( 'Provider integration: production bare-tree shape', () => {
	beforeEach( () => {
		useSelect.mockReset();
	} );

	function Probe( { element } ) {
		const { value } = useInheritedValue(
			element ? { element } : undefined
		);
		return <div data-testid="probe">{ JSON.stringify( value ) }</div>;
	}

	/**
	 * Representative bare-tree fixture shaped like a real
	 * `mergedGlobalStyles.styles` payload from a child theme that:
	 *
	 *   - Sets a root text color, body background, and root line height.
	 *   - Overrides `core/heading` with a font-family + weight.
	 *   - Overrides the `h2` element specifically with a smaller
	 *     font size and a different color.
	 *   - Registers a `plain` variation under `core/quote` that
	 *     drops the border and recolors the text.
	 *   - Includes a `{ ref: 'color.background' }` envelope on the
	 *     `core/group` background to verify ref resolution still
	 *     works end-to-end (ref envelopes resolve against the bare
	 *     tree directly, not the wrapped one).
	 */
	const productionShapeFixture = {
		typography: { lineHeight: '1.6' },
		color: {
			text: '#1a1a1a',
			background: '#ffffff',
		},
		elements: {
			link: { color: { text: '#0073aa' } },
		},
		blocks: {
			'core/heading': {
				typography: {
					fontFamily: 'serif',
					fontWeight: '600',
				},
				elements: {
					h2: {
						typography: { fontSize: '28px' },
						color: { text: '#444444' },
					},
				},
			},
			'core/quote': {
				border: { width: '4px', color: '#cccccc' },
				variations: {
					plain: {
						border: { width: '0px' },
						color: { text: '#666666' },
					},
				},
			},
			'core/group': {
				color: { background: { ref: 'color.background' } },
			},
		},
	};

	function mountWithFixture( ui, rawGlobalStyles = productionShapeFixture ) {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getSettings: () => ( {
					[ globalStylesDataKey ]: rawGlobalStyles,
				} ),
			} ) )
		);
		return render( ui );
	}

	test( 'root + block override merge yields non-empty payload at the panel boundary', () => {
		mountWithFixture(
			<InheritedValueProvider blockName="core/heading">
				<Probe />
			</InheritedValueProvider>
		);
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		expect( parsed ).toMatchObject( {
			typography: {
				lineHeight: '1.6', // from root layer
				fontFamily: 'serif', // from block override
				fontWeight: '600', // from block override
			},
			color: { text: '#1a1a1a' }, // from root layer
		} );
	} );

	test( 'element-folded read sees the h2-specific override + root passthrough', () => {
		mountWithFixture(
			<InheritedValueProvider blockName="core/heading">
				<Probe element="h2" />
			</InheritedValueProvider>
		);
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		expect( parsed.typography.fontSize ).toBe( '28px' ); // h2 override wins
		expect( parsed.typography.lineHeight ).toBe( '1.6' ); // root passthrough
		expect( parsed.color.text ).toBe( '#444444' ); // h2 override wins over root
	} );

	test( 'variation override layers on top of block override', () => {
		mountWithFixture(
			<InheritedValueProvider blockName="core/quote" ownVariation="plain">
				<Probe />
			</InheritedValueProvider>
		);
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		expect( parsed.border.width ).toBe( '0px' ); // variation wins
		expect( parsed.border.color ).toBe( '#cccccc' ); // block passthrough
		expect( parsed.color.text ).toBe( '#666666' ); // variation wins
	} );

	test( '{ ref } envelope resolves against the bare tree at the leaf', () => {
		mountWithFixture(
			<InheritedValueProvider blockName="core/group">
				<Probe />
			</InheritedValueProvider>
		);
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		expect( parsed.color.background ).toBe( '#ffffff' );
	} );

	test( 'block with no overrides still inherits root + element layers', () => {
		mountWithFixture(
			<InheritedValueProvider blockName="core/paragraph">
				<Probe element="link" />
			</InheritedValueProvider>
		);
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		expect( parsed.typography.lineHeight ).toBe( '1.6' );
		// element fold for `link` brings in the root.elements.link override.
		expect( parsed.color.text ).toBe( '#0073aa' );
	} );

	test( 'panel-readable keys are absent when the producer accidentally double-wraps the data', () => {
		// Regression guard against re-introducing the original bug. If
		// a future refactor accidentally double-wraps the data —
		// i.e. stores `{ styles: { typography: ... } }` at the dataKey
		// instead of the bare tree — the Provider's wrapper produces
		// `{ styles: { styles: { typography: ... } } }`, the builder
		// destructures `styles = { styles: { typography: ... } }`, and
		// `pickLayerRootContribution` treats `styles` as a leaf-bearing
		// key so the merged payload is `{ styles: { typography: ... } }`
		// — non-empty in object terms, but the panel-readable keys
		// (`typography`, `color`, ...) are absent at the top level. The
		// user observes the same thing they did before the hot fix: no
		// inherited values surface in the inspector. This case asserts
		// the panel-readable keys are missing, which is what the panels
		// actually consume.
		mountWithFixture(
			<InheritedValueProvider blockName="core/heading">
				<Probe />
			</InheritedValueProvider>,
			{ styles: productionShapeFixture }
		);
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		expect( parsed.typography ).toBeUndefined();
		expect( parsed.color ).toBeUndefined();
	} );
} );
