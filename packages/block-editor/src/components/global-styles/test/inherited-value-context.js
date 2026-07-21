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
import { useResolvedStyle } from '../inherited-value-context';

import { globalStylesDataKey } from '../../../store/private-keys';

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
// `@wordpress/blocks` for `useVariationAndElements`. The blocks store's
// transitive import chain fails under this file's `@wordpress/data` mock
// (missing `createSelector`), so stub the blocks module with just the shape
// needed.
jest.mock( '@wordpress/blocks', () => ( {
	store: { name: 'core/blocks' },
	getBlockType: ( blockName ) =>
		( {
			'core/group': { title: 'Group' },
			'core/heading': { title: 'Heading' },
			'core/paragraph': { title: 'Paragraph' },
		} )[ blockName ],
} ) );

// `useResolvedStyle` derives the applied variation from the block's
// `className`; map `is-style-<slug>` to `<slug>` for these tests. The
// variation-ref resolution itself now lives in `resolveStyle`
// (`@wordpress/global-styles-engine`) and is covered by its own tests.
jest.mock( '../../../hooks/block-style-variation', () => ( {
	getVariationNameFromClass: ( className ) => {
		const match = /is-style-([\w-]+)/.exec( className || '' );
		return match ? match[ 1 ] : null;
	},
} ) );

describe( 'useResolvedStyle hook', () => {
	beforeEach( () => {
		useSelect.mockReset();
	} );

	function Probe( { blockName, className, selectedState } ) {
		const v = useResolvedStyle( blockName, className, selectedState );
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
				// The hook reads the block's `level` attribute to pick the
				// heading element layers; no block edit context is provided
				// here, so `clientId` is undefined and attributes are empty.
				getBlockAttributes: () => ( {} ),
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
 * `resolveStyle`, which destructures `const { styles } =
 * globalStyles` and so saw `undefined` and early-returned `{}`. Every
 * panel got an empty `inheritedValue`; nothing surfaced in the
 * inspector. None of the original suites caught it because their
 * fixtures all set `[ globalStylesDataKey ]: { styles: { ... } }` —
 * encoding the wrong shape assumption.
 *
 * This suite uses fixtures that mirror the production producer's
 * output and asserts the hook → resolver pipeline yields a
 * non-empty `inheritedValue` end-to-end. A future regression on the
 * data-shape contract — at the producer, the wrapping step inside the
 * hook, or the resolver's destructure — surfaces here in CI.
 */
describe( 'useResolvedStyle – production bare-tree shape', () => {
	beforeEach( () => {
		useSelect.mockReset();
	} );

	function Probe( { blockName, className } ) {
		const { value } = useResolvedStyle( blockName, className );
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
				getBlockAttributes: () => ( {} ),
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
		// `{ styles: { styles: { typography: ... } } }`, the resolver
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
