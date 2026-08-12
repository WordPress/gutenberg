import { resolveStyle, privateHelpers } from '../resolve-style';

const {
	isExplicitEmpty,
	isRefObject,
	pickLayerRootContribution,
	deepMergeDroppingEmpties,
} = privateHelpers;

describe( 'resolveStyle – merged output', () => {
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

		test( 'isRefObject recognises { ref: "..." } values', () => {
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

		test( 'deepMergeDroppingEmpties skips refs that resolve to another ref', () => {
			const gs = {
				styles: {
					color: { text: { ref: 'styles.color.other' } },
				},
			};
			const out = deepMergeDroppingEmpties(
				{ color: { text: '#000' } },
				{ color: { text: { ref: 'styles.color.text' } } },
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

		test( 'deepMergeDroppingEmpties replaces backgroundImage wholesale (no key mixing)', () => {
			const out = deepMergeDroppingEmpties(
				{
					background: {
						backgroundImage: {
							id: 5,
							url: 'theme.jpg',
							source: 'file',
							title: 'Theme',
						},
						backgroundSize: 'cover',
					},
				},
				{
					background: {
						backgroundImage: { url: 'custom.jpg' },
					},
				},
				{}
			);
			expect( out.background.backgroundImage ).toEqual( {
				url: 'custom.jpg',
			} );
			expect( out.background.backgroundSize ).toBe( 'cover' );
		} );

		test( 'deepMergeDroppingEmpties clones backgroundImage rather than referencing the source', () => {
			const source = {
				background: { backgroundImage: { url: 'custom.jpg' } },
			};
			const out = deepMergeDroppingEmpties( {}, source, {} );
			expect( out.background.backgroundImage ).toEqual( {
				url: 'custom.jpg',
			} );
			expect( out.background.backgroundImage ).not.toBe(
				source.background.backgroundImage
			);
		} );

		test( 'deepMergeDroppingEmpties records a single source entry for backgroundImage', () => {
			const sources = {};
			deepMergeDroppingEmpties(
				{},
				{ background: { backgroundImage: { id: 1, url: 'a.jpg' } } },
				{},
				{ layer: 'block' },
				sources
			);
			expect( sources[ 'background.backgroundImage' ]?.layer ).toBe(
				'block'
			);
			expect(
				sources[ 'background.backgroundImage.url' ]
			).toBeUndefined();
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
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/paragraph',
			} );
			expect( out.typography.fontSize ).toBe( '16px' );
			expect( out.typography.lineHeight ).toBe( '1.5' );
		} );

		test( 'block-default (layer 3) overrides element + root', () => {
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/heading',
			} );
			expect( out.typography.fontSize ).toBe( '28px' );
			expect( out.typography.lineHeight ).toBe( '1.5' );
		} );

		test( 'own-variation (layer 4b) wins', () => {
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/heading',
				variationName: 'plain',
			} );
			expect( out.typography.fontSize ).toBe( '20px' );
			expect( out.typography.lineHeight ).toBe( '1.1' );
		} );
	} );

	describe( 'state-aware inheritance (viewport + pseudoState)', () => {
		const DEFAULT_STATE = { viewport: 'default', pseudoState: 'default' };
		const HOVER_STATE = { viewport: 'default', pseudoState: ':hover' };
		const MOBILE_STATE = { viewport: '@mobile', pseudoState: 'default' };

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

		test( 'no state behaves as the default state (base value)', () => {
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/button',
			} );
			expect( out.color.text ).toBe( 'buttonBase' );
		} );

		test( 'explicit default state is identical to base', () => {
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/button',
				...DEFAULT_STATE,
			} );
			expect( out.color.text ).toBe( 'buttonBase' );
		} );

		test( 'pseudo state layers the block `:hover` slice over base', () => {
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/button',
				...HOVER_STATE,
			} );
			// Block-level `:hover` wins over the base color.
			expect( out.color.text ).toBe( 'buttonHover' );
		} );

		test( 'base-only leaves still inherit under a selected state (CSS cascade)', () => {
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/button',
				...HOVER_STATE,
			} );
			// fontSize has no `:hover` override → cascades from the base.
			expect( out.typography.fontSize ).toBe( '13px' );
		} );

		test( 'responsive state with no Global Styles slice falls back to base', () => {
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/button',
				...MOBILE_STATE,
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
			const { value: out } = resolveStyle( responsiveGs, {
				blockName: 'core/button',
				...MOBILE_STATE,
			} );
			// The `@mobile` slice wins over the base color...
			expect( out.color.text ).toBe( 'buttonMobile' );
			// ...while base-only leaves cascade from the base (no `@mobile`
			// override for fontSize).
			expect( out.typography.fontSize ).toBe( '13px' );
		} );

		test( 'source map attributes a state-won leaf to its originating layer', () => {
			const { value, sources } = resolveStyle( gs, {
				blockName: 'core/button',
				...HOVER_STATE,
			} );
			expect( value.color.text ).toBe( 'buttonHover' );
			expect( sources[ 'color.text' ]?.layer ).toBe( 'block' );
		} );

		test( 'memoized variant keys distinct states separately', () => {
			const { value: base } = resolveStyle( gs, {
				blockName: 'core/button',
				...DEFAULT_STATE,
			} );
			const { value: hover } = resolveStyle( gs, {
				blockName: 'core/button',
				...HOVER_STATE,
			} );
			expect( base.color.text ).toBe( 'buttonBase' );
			expect( hover.color.text ).toBe( 'buttonHover' );
		} );
	} );

	describe( 'element-based blocks fold root element styles', () => {
		const HOVER_STATE = { viewport: 'default', pseudoState: ':hover' };

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
			const { value, sources } = resolveStyle( gs, {
				blockName: 'core/button',
				elements: [ 'button' ],
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
			const { value, sources } = resolveStyle( gs, {
				blockName: 'core/button',
				elements: [ 'button' ],
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
			const { value } = resolveStyle( gs, {
				blockName: 'core/heading',
				elements: [ 'heading' ],
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
			const { value } = resolveStyle( gs, {
				blockName: 'core/paragraph',
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
			const { value } = resolveStyle( gs, {
				blockName: 'core/button',
				elements: [ 'button' ],
				...HOVER_STATE,
			} );
			expect( value.color.background ).toBe( 'elementHover' );
		} );

		test( 'level-specific `h2` element wins over the generic `heading` element', () => {
			const gs = {
				styles: {
					elements: {
						heading: {
							typography: {
								fontWeight: '700',
								lineHeight: '1.4',
							},
						},
						h2: { typography: { fontWeight: '900' } },
					},
				},
			};
			// `elements` is ordered low to high precedence, so the level layer
			// (`h2`) overrides the shared `heading` layer for the leaves it
			// sets, while `heading`-only leaves still surface.
			const { value, sources } = resolveStyle( gs, {
				blockName: 'core/heading',
				elements: [ 'heading', 'h2' ],
			} );
			expect( value.typography.fontWeight ).toBe( '900' );
			expect( value.typography.lineHeight ).toBe( '1.4' );
			expect( sources[ 'typography.fontWeight' ]?.layer ).toBe(
				'element'
			);
		} );

		test( 'no element layer folds when the caller passes an empty array (level 0)', () => {
			// A Site/Post Title at level 0 renders `<p>`, so the caller maps it
			// to no element keys and neither `heading` nor `hN` should fold.
			const gs = {
				styles: {
					elements: {
						heading: { typography: { fontWeight: '700' } },
						h2: { typography: { fontWeight: '900' } },
					},
				},
			};
			const { value } = resolveStyle( gs, {
				blockName: 'core/post-title',
				elements: [],
			} );
			expect( value.typography?.fontWeight ).toBeUndefined();
		} );

		test( 'block-type styles still override the folded element layers', () => {
			const gs = {
				styles: {
					elements: {
						heading: { typography: { fontWeight: '700' } },
						h2: { typography: { fontWeight: '900' } },
					},
					blocks: {
						'core/heading': {
							typography: { fontWeight: '400' },
						},
					},
				},
			};
			const { value, sources } = resolveStyle( gs, {
				blockName: 'core/heading',
				elements: [ 'heading', 'h2' ],
			} );
			expect( value.typography.fontWeight ).toBe( '400' );
			expect( sources[ 'typography.fontWeight' ]?.layer ).toBe( 'block' );
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
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/heading',
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
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/group',
			} );
			expect( out.spacing.padding.top ).toBe( '0' );
		} );
	} );

	describe( 'hydration + edge cases', () => {
		test( 'falsy globalStyles returns {}', () => {
			expect(
				resolveStyle( null, {
					blockName: 'core/heading',
				} ).value
			).toEqual( {} );
			expect(
				resolveStyle( {}, { blockName: 'core/heading' } ).value
			).toEqual( {} );
		} );

		test( 'missing blockName returns {}', () => {
			expect(
				resolveStyle( {
					styles: { typography: { fontSize: '16px' } },
				} ).value
			).toEqual( {} );
		} );

		test( 'unknown block still inherits from root', () => {
			const gs = { styles: { typography: { fontSize: '16px' } } };
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/does-not-exist',
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
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/paragraph',
			} );
			expect( out.color.text ).toBe( 'var:preset|color|vivid-red' );
		} );

		test( 'var(--wp--preset--...) strings are preserved raw', () => {
			const gs = {
				styles: {
					color: { text: 'var(--wp--preset--color--vivid-red)' },
				},
			};
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/paragraph',
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
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/heading',
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
			const { value: out } = resolveStyle( gs, {
				blockName: 'core/paragraph',
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
			const { value, sources } = resolveStyle( gs, {
				blockName: 'core/heading',
				variationName: 'plain',
			} );
			expect( value.typography.fontSize ).toBe( '20px' );
			expect( value.typography.lineHeight ).toBe( '1.5' );
			expect( sources[ 'typography.fontSize' ] ).toMatchObject( {
				layer: 'blockVariation',
			} );
			expect( sources[ 'typography.lineHeight' ] ).toMatchObject( {
				layer: 'root',
			} );
		} );

		test( 'records preserved element sub-tree source paths', () => {
			const { sources } = resolveStyle( gs, {
				blockName: 'core/paragraph',
			} );
			expect( sources[ 'elements.link.color.text' ] ).toMatchObject( {
				layer: 'root',
			} );
		} );
	} );
} );

describe( 'resolveStyle – memoization', () => {
	test( 'returns the same inheritance object identity for identical keys', () => {
		const gs = { styles: { typography: { fontSize: '16px' } } };
		const a = resolveStyle( gs, {
			blockName: 'core/paragraph',
		} );
		const b = resolveStyle( gs, {
			blockName: 'core/paragraph',
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
		const { value: a } = resolveStyle( gs, {
			blockName: 'core/paragraph',
		} );
		const { value: b } = resolveStyle( gs, {
			blockName: 'core/heading',
		} );
		expect( a.typography.fontSize ).toBe( '16px' );
		expect( b.typography.fontSize ).toBe( '24px' );
		expect( a ).not.toBe( b );
	} );

	test( 'different globalStyles reference → re-computed', () => {
		const gs1 = { styles: { typography: { fontSize: '16px' } } };
		const gs2 = { styles: { typography: { fontSize: '18px' } } };
		const { value: a } = resolveStyle( gs1, {
			blockName: 'core/paragraph',
		} );
		const { value: b } = resolveStyle( gs2, {
			blockName: 'core/paragraph',
		} );
		expect( a.typography.fontSize ).toBe( '16px' );
		expect( b.typography.fontSize ).toBe( '18px' );
		expect( a ).not.toBe( b );
	} );

	test( 'same globalStyles but different _links → re-computed', () => {
		// Same styles payload identity, different theme-file links. The memo
		// must key on `_links` too, so the second call resolves the image
		// against its own links instead of returning the first cache hit.
		const gs = {
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
		};
		const buildWithLinks = ( href ) =>
			resolveStyle(
				{
					...gs,
					_links: {
						'wp:theme-file': [ { name: 'file:./img.jpg', href } ],
					},
				},
				{ blockName: 'core/paragraph' }
			).value.background.backgroundImage.url;

		expect( buildWithLinks( 'https://example.test/a.jpg' ) ).toBe(
			'https://example.test/a.jpg'
		);
		expect( buildWithLinks( 'https://example.test/b.jpg' ) ).toBe(
			'https://example.test/b.jpg'
		);
	} );

	test( 'falsy globalStyles delegates to the pure builder', () => {
		const { value: a } = resolveStyle( null, {
			blockName: 'core/paragraph',
		} );
		expect( a ).toEqual( {} );
	} );

	test( 'different `elements` arrays key distinct cache entries', () => {
		// Two heading levels share a block name and payload, so the element
		// list must take part in the cache key or they would collide.
		const gs = {
			styles: {
				elements: {
					heading: { typography: { fontWeight: '700' } },
					h1: { typography: { fontWeight: '900' } },
					h2: { typography: { fontWeight: '400' } },
				},
			},
		};
		const h1 = resolveStyle( gs, {
			blockName: 'core/heading',
			elements: [ 'heading', 'h1' ],
		} );
		const h2 = resolveStyle( gs, {
			blockName: 'core/heading',
			elements: [ 'heading', 'h2' ],
		} );
		expect( h1 ).not.toBe( h2 );
		expect( h1.value.typography.fontWeight ).toBe( '900' );
		expect( h2.value.typography.fontWeight ).toBe( '400' );

		// Identical element lists still return the memoized identity.
		const h2Again = resolveStyle( gs, {
			blockName: 'core/heading',
			elements: [ 'heading', 'h2' ],
		} );
		expect( h2Again ).toBe( h2 );
	} );
} );

describe( 'resolveStyle – non-cascading root drop', () => {
	// Each call builds against a fresh `globalStyles` object so the
	// identity-keyed memo never returns a cross-test cache hit.
	const build = ( styles, extra = {} ) =>
		resolveStyle(
			{ styles },
			{
				blockName: 'core/paragraph',
				...extra,
			}
		);

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
		const { value } = resolveStyle(
			{
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
				_links: {
					'wp:theme-file': [
						{
							name: 'file:./img.jpg',
							href: 'https://example.test/img.jpg',
						},
					],
				},
			},
			{ blockName: 'core/paragraph' }
		);
		expect( value.background.backgroundImage.url ).toBe(
			'https://example.test/img.jpg'
		);
	} );
} );
