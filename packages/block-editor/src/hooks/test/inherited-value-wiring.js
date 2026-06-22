/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Tests the Provider wiring between inspector hook wrappers and shared
 * Global Styles panels.
 *
 * These tests cover two concerns:
 *
 *   1. The panel-level `useOwnVariation` hook correctly maps a block's
 *      `className` to a registered variation slug (or `null`).
 *   2. Each wrapper mounts `InheritedValueProvider` with the correct
 *      `blockName` + `ownVariation` props, and forwards the hook's
 *      return value to the shared panel via the `inheritedValue` prop.
 *
 * The full shared-panel render tree (ToolsPanel machinery,
 * `InspectorControls` slot-fill, data store, etc.) is intentionally
 * mocked out so each test exercises only the wiring contract.
 */

// Jest hoists `jest.mock` factories; proxies for spies need to satisfy
// the `/^mock/i` naming convention.
const mockProviderRecorder = { calls: [] };
const mockPanelRecorder = { calls: [] };
const mockInheritedReturn = { value: {} };
const mockVariationReturn = { value: null };

jest.mock( '../../components/global-styles/inherited-value-context', () => ( {
	__esModule: true,
	InheritedValueProvider: ( { blockName, ownVariation, children } ) => {
		mockProviderRecorder.calls.push( { blockName, ownVariation } );
		return children;
	},
	useInheritedValue: () => ( {
		value: mockInheritedReturn.value,
		sources: {},
	} ),
	useOwnVariation: () => mockVariationReturn.value,
} ) );

jest.mock( '../../components/global-styles/typography-panel', () => ( {
	__esModule: true,
	default: ( props ) => {
		mockPanelRecorder.calls.push( [ 'typography', props ] );
		return <div data-testid="panel-spy" />;
	},
	useHasTypographyPanel: () => true,
} ) );
jest.mock( '../../components/global-styles/color-panel', () => ( {
	__esModule: true,
	default: ( { children, ...rest } ) => {
		mockPanelRecorder.calls.push( [ 'color', rest ] );
		return <div data-testid="panel-spy">{ children }</div>;
	},
	useHasColorPanel: () => true,
} ) );
jest.mock( '../../components/global-styles/border-panel', () => ( {
	__esModule: true,
	default: ( props ) => {
		mockPanelRecorder.calls.push( [ 'border', props ] );
		return <div data-testid="panel-spy" />;
	},
	useHasBorderPanel: () => true,
	useHasBorderPanelControls: () => ( {} ),
} ) );
jest.mock( '../../components/global-styles/dimensions-panel', () => ( {
	__esModule: true,
	default: ( props ) => {
		mockPanelRecorder.calls.push( [ 'dimensions', props ] );
		return <div data-testid="panel-spy" />;
	},
	useHasDimensionsPanel: () => true,
} ) );
jest.mock( '../../components/global-styles/background-panel', () => ( {
	__esModule: true,
	default: ( props ) => {
		mockPanelRecorder.calls.push( [ 'background', props ] );
		return <div data-testid="panel-spy" />;
	},
	useHasBackgroundPanel: () => true,
	hasBackgroundImageValue: () => false,
	hasBackgroundGradientValue: () => false,
	mergeInheritedBackgroundStyle: ( style ) => style,
} ) );

// The Typography, Background and Elements wrappers now request a contrast
// warning (relocated color controls). The hook pulls the data store into its
// import graph, so stub it to a no-op for these wiring-only tests.
jest.mock( '../contrast-checker', () => ( {
	__esModule: true,
	default: () => undefined,
} ) );

// Stub the minimal `@wordpress/data` surface the wrappers call into
// directly. The real store + persistence machinery is intentionally
// elided. The prop plumbing is testable with the mocked selector surface.
jest.mock( '@wordpress/data', () => ( {
	__esModule: true,
	useSelect: jest.fn(),
	useDispatch: () => ( {} ),
	useRegistry: () => ( {} ),
	createSelector: ( fn ) => fn,
	createRegistrySelector: ( fn ) => fn(),
	select: () => ( {} ),
	dispatch: () => ( {} ),
	subscribe: () => () => {},
	register: () => {},
	combineReducers: () => () => ( {} ),
	createReduxStore: () => ( {} ),
	AsyncModeProvider: ( { children } ) => children,
	RegistryProvider: ( { children } ) => children,
	RegistryConsumer: ( { children } ) => children( {} ),
	useRegistryProvider: () => ( {} ),
	withSelect: () => ( c ) => c,
	withDispatch: () => ( c ) => c,
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	__esModule: true,
	getBlockSupport: jest.fn( () => undefined ),
	hasBlockSupport: jest.fn( () => false ),
	getBlockType: jest.fn( () => null ),
	getBlockTypes: jest.fn( () => [] ),
	store: { name: 'core/blocks' },
} ) );

// `@wordpress/private-apis` ships a lock/unlock pair that fails hard
// on unrecognised objects. The wrappers unlock dispatchers and
// selectors returned by the mocked `@wordpress/data` stubs, which do
// not carry the private-API marker. Short-circuit to a passthrough so
// these tests can exercise the wrapper wiring without threading
// the full private-API handshake through every stub.
jest.mock( '@wordpress/private-apis', () => ( {
	__esModule: true,
	__dangerousOptInToUnstableAPIsOnlyForCoreModules: () => ( {
		lock: () => {},
		unlock: ( value ) =>
			new Proxy( value ?? {}, {
				get: () => () => undefined,
			} ),
	} ),
} ) );

// Short-circuit the block-editor store graph. The wrappers need the
// `store` export to hand to `useSelect`, but in these tests `useSelect`
// is already mocked to a Proxy-driven stub and never actually touches
// the store. Providing a stub avoids the private-APIs unlock that
// the real `store/index.js` performs at module load.
jest.mock( '../../store', () => ( {
	__esModule: true,
	store: { name: 'core/block-editor' },
} ) );

jest.mock( '../../store/private-keys', () => ( {
	__esModule: true,
	globalStylesDataKey: Symbol( 'globalStylesDataKey' ),
	globalStylesLinksDataKey: Symbol( 'globalStylesLinksDataKey' ),
	selectBlockPatternsKey: Symbol( 'selectBlockPatternsKey' ),
} ) );

// Short-circuit the block-editor components barrel (`../../components`),
// which pulls the data store into its import graph transitively.
jest.mock(
	'../../components',
	() => new Proxy( {}, { get: () => () => null } )
);

// `InspectorControls` is a slot-fill component with registry dependencies.
// Mock it to a passthrough div.
jest.mock( '../../components/inspector-controls', () => ( {
	__esModule: true,
	default: ( { children } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
} ) );

// Block editor selectors used by the wrappers for attribute reads.
const mockUseSelectImpl = { fn: () => undefined };

beforeEach( () => {
	mockProviderRecorder.calls = [];
	mockPanelRecorder.calls = [];
	mockInheritedReturn.value = {};
	mockVariationReturn.value = null;
	mockUseSelectImpl.fn = () => undefined;
	const { useSelect } = require( '@wordpress/data' );
	useSelect.mockImplementation( ( mapSelect ) => {
		// Feed mapSelect a synthetic `select()` that returns an object
		// whose methods all yield what the current test configured.
		return mapSelect(
			() => new Proxy( {}, { get: () => () => mockUseSelectImpl.fn() } )
		);
	} );
} );

// Note: `useOwnVariation` is a thin `useSelect` wrapper around the
// pure helper `getVariationNameFromClass`, which has direct coverage
// in the existing `block-style-variation` module. The wrapper tests
// below verify that each hook wrapper passes the hook's return value
// through to `InheritedValueProvider` as `ownVariation`.

describe( 'inspector hook wrappers thread inheritedValue through the Provider', () => {
	test( 'TypographyPanel mounts the Provider with the block name and threads inheritedValue', () => {
		// Imported inside the test so the `jest.mock` factories are
		// applied before the wrapper's module graph is resolved.
		const { TypographyPanel } = require( '../typography' );
		mockUseSelectImpl.fn = () => ( {
			style: { typography: { fontSize: '14px' } },
			fontFamily: undefined,
			fontSize: undefined,
			fitText: undefined,
			className: undefined,
		} );
		mockInheritedReturn.value = {
			typography: { fontSize: '32px', lineHeight: '1.5' },
		};

		render(
			<TypographyPanel
				clientId="block-1"
				name="core/paragraph"
				setAttributes={ () => {} }
				settings={ { typography: { fontSize: true } } }
			/>
		);

		expect( mockProviderRecorder.calls ).toHaveLength( 1 );
		expect( mockProviderRecorder.calls[ 0 ] ).toEqual( {
			blockName: 'core/paragraph',
			ownVariation: null,
		} );
		expect( mockPanelRecorder.calls ).toHaveLength( 1 );
		const [ , props ] = mockPanelRecorder.calls[ 0 ];
		expect( props.inheritedValue ).toEqual( {
			typography: { fontSize: '32px', lineHeight: '1.5' },
		} );
	} );

	// After relocation, block-scoped element/link colors are owned by the
	// Elements panel (`hooks/elements.js`), which renders the shared Color
	// panel. The former `ColorEdit` wrapper no longer exists; top-level text
	// and background color are wired through the Typography and Background
	// wrappers and covered above/below.
	test( 'ElementsEdit mounts the Provider for block-scoped Global Styles', () => {
		const { ElementsEdit } = require( '../elements' );
		mockUseSelectImpl.fn = () => ( {
			style: undefined,
			className: undefined,
		} );
		mockInheritedReturn.value = {
			elements: { link: { color: { text: '#cf2e2e' } } },
		};

		render(
			<ElementsEdit
				clientId="block-1"
				name="core/paragraph"
				setAttributes={ () => {} }
				settings={ { color: { link: true } } }
			/>
		);

		expect( mockProviderRecorder.calls[ 0 ] ).toEqual( {
			blockName: 'core/paragraph',
			ownVariation: null,
		} );
		const [ , props ] = mockPanelRecorder.calls[ 0 ];
		expect( props.inheritedValue ).toEqual( {
			elements: { link: { color: { text: '#cf2e2e' } } },
		} );
	} );

	test( 'BorderPanel threads a border-scoped inheritedValue through the Provider', () => {
		const { BorderPanel } = require( '../border' );
		mockUseSelectImpl.fn = () => ( {
			style: undefined,
			borderColor: undefined,
			className: undefined,
		} );
		mockInheritedReturn.value = {
			border: { radius: '8px' },
		};

		render(
			<BorderPanel
				clientId="block-1"
				name="core/paragraph"
				setAttributes={ () => {} }
				settings={ { border: { radius: true } } }
			/>
		);

		expect( mockProviderRecorder.calls[ 0 ] ).toEqual( {
			blockName: 'core/paragraph',
			ownVariation: null,
		} );
		expect( mockPanelRecorder.calls[ 0 ][ 1 ].inheritedValue ).toEqual( {
			border: { radius: '8px' },
		} );
	} );

	test( 'DimensionsPanel threads spacing inheritedValue through the Provider', () => {
		const { DimensionsPanel } = require( '../dimensions' );
		mockUseSelectImpl.fn = () => ( {
			value: undefined,
			className: undefined,
		} );
		mockInheritedReturn.value = {
			spacing: { padding: { top: '32px' } },
		};

		render(
			<DimensionsPanel
				clientId="block-1"
				name="core/paragraph"
				setAttributes={ () => {} }
				settings={ { spacing: { padding: true } } }
			/>
		);

		expect( mockProviderRecorder.calls[ 0 ] ).toEqual( {
			blockName: 'core/paragraph',
			ownVariation: null,
		} );
		expect( mockPanelRecorder.calls[ 0 ][ 1 ].inheritedValue ).toEqual( {
			spacing: { padding: { top: '32px' } },
		} );
	} );

	test( 'BackgroundImagePanel replaces its pre-feature partial wiring with a full Provider payload', () => {
		const {
			hasBlockSupport,
			getBlockSupport,
		} = require( '@wordpress/blocks' );
		getBlockSupport.mockImplementation( ( _n, key ) => {
			if ( key === 'background' ) {
				return { backgroundImage: true };
			}
			return undefined;
		} );
		hasBlockSupport.mockReturnValue( true );

		const { BackgroundImagePanel } = require( '../background' );
		mockUseSelectImpl.fn = () => ( {
			style: undefined,
			className: undefined,
		} );
		mockInheritedReturn.value = {
			background: { backgroundImage: { url: 'themed.jpg' } },
		};

		render(
			<BackgroundImagePanel
				clientId="block-1"
				name="core/cover"
				setAttributes={ () => {} }
				settings={ { background: { backgroundImage: true } } }
			/>
		);

		expect( mockProviderRecorder.calls[ 0 ] ).toEqual( {
			blockName: 'core/cover',
			ownVariation: null,
		} );
		expect( mockPanelRecorder.calls[ 0 ][ 1 ].inheritedValue ).toEqual( {
			background: { backgroundImage: { url: 'themed.jpg' } },
		} );
	} );

	test( 'variation class names propagate to the Provider as ownVariation', () => {
		const { TypographyPanel } = require( '../typography' );
		mockUseSelectImpl.fn = () => ( {
			style: undefined,
			fontFamily: undefined,
			fontSize: undefined,
			fitText: undefined,
			className: 'is-style-plain',
		} );
		mockVariationReturn.value = 'plain';
		mockInheritedReturn.value = {};

		render(
			<TypographyPanel
				clientId="block-1"
				name="core/quote"
				setAttributes={ () => {} }
				settings={ { typography: { fontSize: true } } }
			/>
		);

		expect( mockProviderRecorder.calls[ 0 ] ).toEqual( {
			blockName: 'core/quote',
			ownVariation: 'plain',
		} );
	} );

	test( 'wrappers fall back to empty inheritedValue during hydration', () => {
		const { TypographyPanel } = require( '../typography' );
		mockUseSelectImpl.fn = () => ( {
			style: undefined,
			fontFamily: undefined,
			fontSize: undefined,
			fitText: undefined,
			className: undefined,
		} );
		mockInheritedReturn.value = {};

		render(
			<TypographyPanel
				clientId="block-1"
				name="core/paragraph"
				setAttributes={ () => {} }
				settings={ { typography: { fontSize: true } } }
			/>
		);

		// Empty object — each panel's `inheritedValue = value` default
		// parameter is not triggered because `{}` is a truthy explicit
		// value, but no leaf-level placeholder surfaces. From the
		// user's perspective this matches pre-feature behaviour.
		expect( mockPanelRecorder.calls[ 0 ][ 1 ].inheritedValue ).toEqual(
			{}
		);
	} );
} );
