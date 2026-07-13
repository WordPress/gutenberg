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
import { resolveStyles, privateHelpers } from '../resolve-styles';
import { useResolvedStyles } from '../inherited-value-context';

import { globalStylesDataKey } from '../../../store/private-keys';
const {
	isExplicitEmpty,
	isRefObject,
	pickLayerRootContribution,
	deepMergeDroppingEmpties,
} = privateHelpers;

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
	// `useResolvedStyles` derives the applied variation from the block's
	// `className`; map `is-style-<slug>` to `<slug>` for these tests.
	getVariationNameFromClass: ( className ) => {
		const match = /is-style-([\w-]+)/.exec( className || '' );
		return match ? match[ 1 ] : null;
	},
} ) );
describe( 'resolveStyles – merged output', () => {
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
			const { value: out } = resolveStyles( {
				blockName: 'core/paragraph',
				globalStyles: gs,
			} );
			expect( out.typography.fontSize ).toBe( '16px' );
			expect( out.typography.lineHeight ).toBe( '1.5' );
		} );

		test( 'block-default (layer 3) overrides element + root', () => {
			const { value: out } = resolveStyles( {
				blockName: 'core/heading',
				globalStyles: gs,
			} );
			expect( out.typography.fontSize ).toBe( '28px' );
			expect( out.typography.lineHeight ).toBe( '1.5' );
		} );

		test( 'own-variation (layer 4b) wins', () => {
			const { value: out } = resolveStyles( {
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
			const { value: out } = resolveStyles( {
				blockName: 'core/button',
				globalStyles: gs,
			} );
			expect( out.color.text ).toBe( 'buttonBase' );
		} );

		test( 'explicit default selectedState is identical to base', () => {
			const { value: out } = resolveStyles( {
				blockName: 'core/button',
				globalStyles: gs,
				selectedState: DEFAULT_STATE,
			} );
			expect( out.color.text ).toBe( 'buttonBase' );
		} );

		test( 'pseudo state layers the block `:hover` slice over base', () => {
			const { value: out } = resolveStyles( {
				blockName: 'core/button',
				globalStyles: gs,
				selectedState: HOVER_STATE,
			} );
			// Block-level `:hover` wins over the base color.
			expect( out.color.text ).toBe( 'buttonHover' );
		} );

		test( 'base-only leaves still inherit under a selected state (CSS cascade)', () => {
			const { value: out } = resolveStyles( {
				blockName: 'core/button',
				globalStyles: gs,
				selectedState: HOVER_STATE,
			} );
			// fontSize has no `:hover` override → cascades from the base.
			expect( out.typography.fontSize ).toBe( '13px' );
		} );

		test( 'responsive state with no Global Styles slice falls back to base', () => {
			const { value: out } = resolveStyles( {
				blockName: 'core/button',
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
			const { value: out } = resolveStyles( {
				blockName: 'core/button',
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
			const { value, sources } = resolveStyles( {
				blockName: 'core/button',
				globalStyles: gs,
				selectedState: HOVER_STATE,
			} );
			expect( value.color.text ).toBe( 'buttonHover' );
			expect( sources[ 'color.text' ]?.layer ).toBe( 'block' );
		} );

		test( 'memoized variant keys distinct states separately', () => {
			const { value: base } = resolveStyles( {
				blockName: 'core/button',
				globalStyles: gs,
				selectedState: DEFAULT_STATE,
			} );
			const { value: hover } = resolveStyles( {
				blockName: 'core/button',
				globalStyles: gs,
				selectedState: HOVER_STATE,
			} );
			expect( base.color.text ).toBe( 'buttonBase' );
			expect( hover.color.text ).toBe( 'buttonHover' );
		} );
	} );

	describe( 'element-based blocks fold root element styles', () => {
		const HOVER_STATE = { viewport: 'default', pseudo: ':hover' };

		test( 'core/button picks up root `elements.button` color and typography', () => {
			const gs = {
				styles: {
					elements: {
						button: {
							color: { text: '#fff', background: '#0073aa' },
							typography: { fontSize: '18px' },
							border: { radius: '4px' },
						},
					},
				},
			};
			const { value, sources } = resolveStyles( {
				blockName: 'core/button',
				globalStyles: gs,
			} );
			// Element styles surface as the block's own inherited values, so
			// the Typography/Background/Border controls reflect the canvas.
			expect( value.color.text ).toBe( '#fff' );
			expect( value.color.background ).toBe( '#0073aa' );
			expect( value.typography.fontSize ).toBe( '18px' );
			expect( value.border.radius ).toBe( '4px' );
			// Attributed to the element layer, and NOT dropped as a
			// non-cascading root leaf (background/border cascade to the block
			// via the element selector).
			expect( sources[ 'color.background' ]?.layer ).toBe( 'element' );
			expect( sources[ 'border.radius' ]?.layer ).toBe( 'element' );
		} );

		test( 'block-type styles override root element styles', () => {
			const gs = {
				styles: {
					elements: {
						button: { color: { text: 'elementText' } },
					},
					blocks: {
						'core/button': { color: { text: 'blockText' } },
					},
				},
			};
			const { value, sources } = resolveStyles( {
				blockName: 'core/button',
				globalStyles: gs,
			} );
			expect( value.color.text ).toBe( 'blockText' );
			expect( sources[ 'color.text' ]?.layer ).toBe( 'block' );
		} );

		test( 'core/heading picks up root `elements.heading` styles', () => {
			const gs = {
				styles: {
					elements: {
						heading: { typography: { fontWeight: '700' } },
					},
				},
			};
			const { value } = resolveStyles( {
				blockName: 'core/heading',
				globalStyles: gs,
			} );
			expect( value.typography.fontWeight ).toBe( '700' );
		} );

		test( 'non element-based blocks ignore root element styles', () => {
			const gs = {
				styles: {
					elements: {
						button: { color: { text: 'elementText' } },
					},
				},
			};
			const { value } = resolveStyles( {
				blockName: 'core/paragraph',
				globalStyles: gs,
			} );
			expect( value.color?.text ).toBeUndefined();
		} );

		test( 'element `:hover` slice layers over the base under a pseudo state', () => {
			const gs = {
				styles: {
					elements: {
						button: {
							color: { background: 'elementBase' },
							':hover': { color: { background: 'elementHover' } },
						},
					},
				},
			};
			const { value } = resolveStyles( {
				blockName: 'core/button',
				globalStyles: gs,
				selectedState: HOVER_STATE,
			} );
			expect( value.color.background ).toBe( 'elementHover' );
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
			const { value: out } = resolveStyles( {
				blockName: 'core/heading',
				globalStyles: gs,
			} );
			expect( out.typography.fontSize ).toBe( '16px' );
		} );

		test( 'zero-valued leaf is NOT empty', () => {
			const gs = {
				styles: {
					blocks: {
						'core/group': {
							spacing: { padding: { top: '0' } },
						},
					},
				},
			};
			const { value: out } = resolveStyles( {
				blockName: 'core/group',
				globalStyles: gs,
			} );
			expect( out.spacing.padding.top ).toBe( '0' );
		} );
	} );

	describe( 'hydration + edge cases', () => {
		test( 'falsy globalStyles returns {}', () => {
			expect(
				resolveStyles( {
					blockName: 'core/heading',
					globalStyles: null,
				} ).value
			).toEqual( {} );
			expect(
				resolveStyles( {
					blockName: 'core/heading',
					globalStyles: {},
				} ).value
			).toEqual( {} );
		} );

		test( 'missing blockName returns {}', () => {
			expect(
				resolveStyles( {
					globalStyles: {
						styles: { typography: { fontSize: '16px' } },
					},
				} ).value
			).toEqual( {} );
		} );

		test( 'unknown block still inherits from root', () => {
			const gs = { styles: { typography: { fontSize: '16px' } } };
			const { value: out } = resolveStyles( {
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
			const { value: out } = resolveStyles( {
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
			const { value: out } = resolveStyles( {
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
			const { value: out } = resolveStyles( {
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
			const { value: out } = resolveStyles( {
				blockName: 'core/paragraph',
				globalStyles: gs,
			} );
			expect( out.elements.link.color.text ).toBe( '#0073aa' );
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
			const { value, sources } = resolveStyles( {
				blockName: 'core/heading',
				ownVariation: 'plain',
				globalStyles: gs,
			} );
			expect( value.typography.fontSize ).toBe( '20px' );
			expect( value.typography.lineHeight ).toBe( '1.5' );
			expect( sources[ 'typography.fontSize' ] ).toMatchObject( {
				layer: 'blockVariation',
				path: [ 'typography', 'fontSize' ],
			} );
			expect( sources[ 'typography.lineHeight' ] ).toMatchObject( {
				layer: 'root',
			} );
		} );

		test( 'records preserved element sub-tree source paths', () => {
			const { sources } = resolveStyles( {
				blockName: 'core/paragraph',
				globalStyles: gs,
			} );
			expect( sources[ 'elements.link.color.text' ] ).toMatchObject( {
				layer: 'root',
				path: [ 'elements', 'link', 'color', 'text' ],
			} );
		} );
	} );
} );

describe( 'resolveStyles – memoization', () => {
	test( 'returns the same inheritance object identity for identical keys', () => {
		const gs = { styles: { typography: { fontSize: '16px' } } };
		const a = resolveStyles( {
			blockName: 'core/paragraph',
			globalStyles: gs,
		} );
		const b = resolveStyles( {
			blockName: 'core/paragraph',
			globalStyles: gs,
		} );
		expect( a ).toBe( b );
		expect( a.value.typography.fontSize ).toBe( '16px' );
		expect( a.sources[ 'typography.fontSize' ].layer ).toBe( 'root' );
	} );

	test( 'different composite key → different result', () => {
		const gs = {
			styles: {
				typography: { fontSize: '16px' },
				blocks: {
					'core/heading': { typography: { fontSize: '24px' } },
				},
			},
		};
		const { value: a } = resolveStyles( {
			blockName: 'core/paragraph',
			globalStyles: gs,
		} );
		const { value: b } = resolveStyles( {
			blockName: 'core/heading',
			globalStyles: gs,
		} );
		expect( a.typography.fontSize ).toBe( '16px' );
		expect( b.typography.fontSize ).toBe( '24px' );
		expect( a ).not.toBe( b );
	} );

	test( 'different globalStyles reference → re-computed', () => {
		const gs1 = { styles: { typography: { fontSize: '16px' } } };
		const gs2 = { styles: { typography: { fontSize: '18px' } } };
		const { value: a } = resolveStyles( {
			blockName: 'core/paragraph',
			globalStyles: gs1,
		} );
		const { value: b } = resolveStyles( {
			blockName: 'core/paragraph',
			globalStyles: gs2,
		} );
		expect( a.typography.fontSize ).toBe( '16px' );
		expect( b.typography.fontSize ).toBe( '18px' );
		expect( a ).not.toBe( b );
	} );

	test( 'falsy globalStyles delegates to the pure builder', () => {
		const { value: a } = resolveStyles( {
			blockName: 'core/paragraph',
			globalStyles: null,
		} );
		expect( a ).toEqual( {} );
	} );
} );

describe( 'useResolvedStyles hook', () => {
	beforeEach( () => {
		useSelect.mockReset();
	} );

	function Probe( { blockName, className, selectedState } ) {
		const v = useResolvedStyles( blockName, className, selectedState );
		return <div data-testid="probe">{ JSON.stringify( v ) }</div>;
	}

	// The hook issues two `useSelect` reads: the merged Global Styles
	// payload (block-editor store) and the block's registered styles
	// (blocks store). Feed both from one stub.
	function mockStores( rawGlobalStyles, blockStyles = [] ) {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				// `globalStylesDataKey` holds the BARE merged styles tree
				// in production (see `editor/src/components/provider/
				// use-block-editor-settings.js:237`,
				// `mergedGlobalStyles.styles`), not the wrapped
				// `{ settings, styles }` envelope. The hook wraps the bare
				// tree before passing to the builder.
				getSettings: () => ( {
					[ globalStylesDataKey ]: rawGlobalStyles,
				} ),
				getBlockStyles: () => blockStyles,
			} ) )
		);
	}

	test( 'returns empty value and sources when no block name is given', () => {
		mockStores( { typography: { fontSize: '16px' } } );
		render( <Probe /> );
		expect( screen.getByTestId( 'probe' ) ).toHaveTextContent(
			'{"value":{},"sources":{}}'
		);
	} );

	test( 'returns empty value and sources during hydration', () => {
		mockStores( null );
		render( <Probe blockName="core/heading" /> );
		expect( screen.getByTestId( 'probe' ) ).toHaveTextContent(
			'{"value":{},"sources":{}}'
		);
	} );

	test( 'reads the block element passthrough from the merged payload', () => {
		mockStores( {
			typography: { fontSize: '16px' },
			elements: { h2: { typography: { fontSize: '24px' } } },
		} );
		render( <Probe blockName="core/heading" /> );
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		// The h2 element styles are preserved under the nested
		// `elements` passthrough, not folded up to the top level.
		expect( parsed.value.elements.h2.typography.fontSize ).toBe( '24px' );
		expect(
			parsed.sources[ 'elements.h2.typography.fontSize' ].layer
		).toBe( 'root' );
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
 * Pre-hot-fix, the hook passed the bare tree directly to
 * `resolveStyles`, which destructures `const { styles } =
 * globalStyles` and so saw `undefined` and early-returned `{}`. Every
 * panel got an empty `inheritedValue`; nothing surfaced in the
 * inspector. None of the original suites caught it because their
 * fixtures all set `[ globalStylesDataKey ]: { styles: { ... } }` —
 * encoding the wrong shape assumption.
 *
 * This suite uses fixtures that mirror the production producer's
 * output and asserts the hook → builder pipeline yields a
 * non-empty `inheritedValue` end-to-end. A future regression on the
 * data-shape contract — at the producer, the wrapping step inside the
 * hook, or the builder's destructure — surfaces here in CI.
 */
describe( 'useResolvedStyles – production bare-tree shape', () => {
	beforeEach( () => {
		useSelect.mockReset();
	} );

	function Probe( { blockName, className } ) {
		const { value } = useResolvedStyles( blockName, className );
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
	 *   - Includes a `{ ref: 'styles.color.background' }` envelope on
	 *     the `core/group` background to verify ref resolution still
	 *     works end-to-end (ref envelopes resolve against the wrapped
	 *     `{ styles }` tree). This is block-sourced, so it survives the
	 *     non-cascading root drop.
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
				color: { background: { ref: 'styles.color.background' } },
			},
		},
	};

	function mountWithFixture( ui, rawGlobalStyles = productionShapeFixture ) {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getSettings: () => ( {
					[ globalStylesDataKey ]: rawGlobalStyles,
				} ),
				getBlockStyles: () => [],
			} ) )
		);
		return render( ui );
	}

	test( 'root + block override merge yields non-empty payload at the panel boundary', () => {
		mountWithFixture( <Probe blockName="core/heading" /> );
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

	test( 'block element override is preserved under the elements passthrough', () => {
		mountWithFixture( <Probe blockName="core/heading" /> );
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		// Block-level h2 override stays nested under `elements.h2`.
		expect( parsed.elements.h2.typography.fontSize ).toBe( '28px' );
		expect( parsed.elements.h2.color.text ).toBe( '#444444' );
		// Root + block overrides still merge at the top level.
		expect( parsed.typography.lineHeight ).toBe( '1.6' );
	} );

	test( 'variation override layers on top of block override', () => {
		mountWithFixture(
			<Probe blockName="core/quote" className="is-style-plain" />
		);
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		expect( parsed.border.width ).toBe( '0px' ); // variation wins
		expect( parsed.border.color ).toBe( '#cccccc' ); // block passthrough
		expect( parsed.color.text ).toBe( '#666666' ); // variation wins
	} );

	test( '{ ref } envelope resolves against the bare tree at the leaf', () => {
		mountWithFixture( <Probe blockName="core/group" /> );
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		expect( parsed.color.background ).toBe( '#ffffff' );
	} );

	test( 'block with no overrides still inherits root + element layers', () => {
		mountWithFixture( <Probe blockName="core/paragraph" /> );
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		expect( parsed.typography.lineHeight ).toBe( '1.6' );
		// The root link element styles stay nested under `elements.link`.
		expect( parsed.elements.link.color.text ).toBe( '#0073aa' );
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
		mountWithFixture( <Probe blockName="core/heading" />, {
			styles: productionShapeFixture,
		} );
		const parsed = JSON.parse( screen.getByTestId( 'probe' ).textContent );
		expect( parsed.typography ).toBeUndefined();
		expect( parsed.color ).toBeUndefined();
	} );
} );

describe( 'resolveStyles – non-cascading root drop', () => {
	// Each call builds against a fresh `globalStyles` object so the
	// identity-keyed memo never returns a cross-test cache hit.
	const build = ( styles, extra = {} ) =>
		resolveStyles( {
			blockName: 'core/paragraph',
			globalStyles: { styles },
			...extra,
		} );

	test( 'drops a root-sourced background color and its source', () => {
		const { value, sources } = build( {
			color: { background: '#ff0000' },
		} );
		expect( value?.color?.background ).toBeUndefined();
		expect( sources[ 'color.background' ] ).toBeUndefined();
	} );

	test( 'drops a root-sourced background gradient', () => {
		const { value } = build( {
			color: { gradient: 'linear-gradient(#fff,#000)' },
		} );
		expect( value?.color?.gradient ).toBeUndefined();
	} );

	test( 'drops root-sourced spacing, border, shadow and duotone', () => {
		const { value } = build( {
			spacing: { padding: { top: '10px' } },
			border: { width: '2px' },
			shadow: 'var:preset|shadow|natural',
			filter: { duotone: [ '#000', '#fff' ] },
		} );
		expect( value?.spacing?.padding ).toBeUndefined();
		expect( value?.border?.width ).toBeUndefined();
		expect( value?.shadow ).toBeUndefined();
		expect( value?.filter?.duotone ).toBeUndefined();
	} );

	test( 'drops root-sourced dimensions (closes the minHeight gap)', () => {
		// Dimensions are non-cascading; the panels never filtered them before,
		// so this pins the closed gap.
		const { value } = build( { dimensions: { minHeight: '50vh' } } );
		expect( value?.dimensions?.minHeight ).toBeUndefined();
	} );

	test( 'keeps root-sourced typography and text color (they cascade)', () => {
		const { value, sources } = build( {
			typography: { fontSize: '16px' },
			color: { text: '#111111' },
		} );
		expect( value.typography.fontSize ).toBe( '16px' );
		expect( value.color.text ).toBe( '#111111' );
		expect( sources[ 'color.text' ].layer ).toBe( 'root' );
	} );

	test( 'keeps the root-sourced elements passthrough (element rules apply globally)', () => {
		const { value } = build( {
			elements: { link: { color: { text: '#0000ff' } } },
		} );
		expect( value.elements.link.color.text ).toBe( '#0000ff' );
	} );

	test( 'keeps a block-sourced background color (only root is non-cascading)', () => {
		const { value, sources } = build( {
			blocks: {
				'core/paragraph': { color: { background: '#00ff00' } },
			},
		} );
		expect( value.color.background ).toBe( '#00ff00' );
		expect( sources[ 'color.background' ].layer ).toBe( 'block' );
	} );

	test( 'resolves a theme-file background image url via _links', () => {
		const { value } = resolveStyles( {
			blockName: 'core/paragraph',
			globalStyles: {
				styles: {
					blocks: {
						'core/paragraph': {
							background: {
								backgroundImage: {
									url: 'file:./img.jpg',
									source: 'file',
								},
							},
						},
					},
				},
			},
			_links: {
				'wp:theme-file': [
					{
						name: 'file:./img.jpg',
						href: 'https://example.test/img.jpg',
					},
				],
			},
		} );
		expect( value.background.backgroundImage.url ).toBe(
			'https://example.test/img.jpg'
		);
	} );
} );
