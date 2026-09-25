import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { TypographyPanel } from '../typography';
import { ElementsEdit } from '../elements';
import { BorderPanel } from '../border';
import { DimensionsPanel } from '../dimensions';
import { BackgroundImagePanel } from '../background';

/**
 * Tests the wiring between inspector hook wrappers and shared
 * Global Styles panels.
 *
 * Each wrapper calls `useResolvedStyle( blockName, className, selectedState )`
 * and forwards the returned merged value to the shared panel via the
 * `inheritedValue` prop. The full shared-panel render tree (ToolsPanel
 * machinery, `InspectorControls` slot-fill, data store, etc.) is
 * intentionally mocked out so each test exercises only the wiring contract.
 */

// Vitest hoists `vi.mock` factories, so recorder values are exposed through
// mutable objects that the factories can close over safely.
const mockHookRecorder = { calls: [] };
const mockPanelRecorder = { calls: [] };
const mockInheritedReturn = { value: {} };

vi.mock(
	import( '../../components/global-styles/inherited-value-context' ),
	() => ( {
		__esModule: true,
		useResolvedStyle: ( blockName, className, selectedState ) => {
			mockHookRecorder.calls.push( {
				blockName,
				className,
				selectedState,
			} );
			return {
				value: mockInheritedReturn.value,
				sources: {},
			};
		},
	} )
);

vi.mock( import( '../../components/global-styles/typography-panel' ), () => ( {
	__esModule: true,
	default: ( props ) => {
		mockPanelRecorder.calls.push( [ 'typography', props ] );
		return <div data-testid="panel-spy" />;
	},
	useHasTypographyPanel: () => true,
} ) );
vi.mock( import( '../../components/global-styles/color-panel' ), () => ( {
	__esModule: true,
	default: ( { children, ...rest } ) => {
		mockPanelRecorder.calls.push( [ 'color', rest ] );
		return <div data-testid="panel-spy">{ children }</div>;
	},
	useHasColorPanel: () => true,
} ) );
vi.mock( import( '../../components/global-styles/border-panel' ), () => ( {
	__esModule: true,
	default: ( props ) => {
		mockPanelRecorder.calls.push( [ 'border', props ] );
		return <div data-testid="panel-spy" />;
	},
	useHasBorderPanel: () => true,
	useHasBorderPanelControls: () => ( {} ),
} ) );
vi.mock( import( '../../components/global-styles/dimensions-panel' ), () => ( {
	__esModule: true,
	default: ( props ) => {
		mockPanelRecorder.calls.push( [ 'dimensions', props ] );
		return <div data-testid="panel-spy" />;
	},
	useHasDimensionsPanel: () => true,
} ) );
vi.mock( import( '../../components/global-styles/background-panel' ), () => ( {
	__esModule: true,
	default: ( props ) => {
		mockPanelRecorder.calls.push( [ 'background', props ] );
		return <div data-testid="panel-spy" />;
	},
	useHasBackgroundPanel: () => true,
	hasBackgroundImageValue: () => false,
	hasBackgroundGradientValue: () => false,
} ) );

// The Typography, Background and Elements wrappers now request a contrast
// warning (relocated color controls). The hook pulls the data store into its
// import graph, so stub it to a no-op for these wiring-only tests.
vi.mock( import( '../contrast-checker' ), () => ( {
	__esModule: true,
	default: () => undefined,
} ) );

// Stub the minimal `@wordpress/data` surface the wrappers call into
// directly. The real store + persistence machinery is intentionally
// elided. The prop plumbing is testable with the mocked selector surface.
vi.mock( import( '@wordpress/data' ), () => ( {
	__esModule: true,
	useSelect: vi.fn(),
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

vi.mock( import( '@wordpress/blocks' ), () => ( {
	__esModule: true,
	getBlockSupport: vi.fn( () => undefined ),
	hasBlockSupport: vi.fn( () => false ),
	getBlockType: vi.fn( () => null ),
	getBlockTypes: vi.fn( () => [] ),
	store: { name: 'core/blocks' },
} ) );

// `@wordpress/private-apis` ships a lock/unlock pair that fails hard
// on unrecognised objects. The wrappers unlock dispatchers and
// selectors returned by the mocked `@wordpress/data` stubs, which do
// not carry the private-API marker. Short-circuit to a passthrough so
// these tests can exercise the wrapper wiring without threading
// the full private-API handshake through every stub.
vi.mock( import( '@wordpress/private-apis' ), () => ( {
	__esModule: true,
	__dangerousOptInToUnstableAPIsOnlyForCoreModules: () => ( {
		lock: () => {},
		unlock: () => ( {
			hideBlockInterface: () => undefined,
			showBlockInterface: () => undefined,
		} ),
	} ),
} ) );

// Short-circuit the block-editor store graph. The wrappers need the
// `store` export to hand to `useSelect`, but in these tests `useSelect`
// is already mocked to a Proxy-driven stub and never actually touches
// the store. Providing a stub avoids the private-APIs unlock that
// the real `store/index.js` performs at module load.
vi.mock( import( '../../store' ), () => ( {
	__esModule: true,
	store: { name: 'core/block-editor' },
} ) );

vi.mock( import( '../../store/private-keys' ), () => ( {
	__esModule: true,
	globalStylesDataKey: Symbol( 'globalStylesDataKey' ),
	globalStylesLinksDataKey: Symbol( 'globalStylesLinksDataKey' ),
	selectBlockPatternsKey: Symbol( 'selectBlockPatternsKey' ),
} ) );

// Short-circuit the block-editor components barrel (`../../components`),
// which pulls the data store into its import graph transitively.
vi.mock( import( '../../components' ), () => ( {} ) );

// `InspectorControls` is a slot-fill component with registry dependencies.
// Mock it to a passthrough div.
vi.mock( import( '../../components/inspector-controls' ), () => ( {
	__esModule: true,
	default: ( { children } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
} ) );

// Block editor selectors used by the wrappers for attribute reads.
const mockUseSelectImpl = { fn: () => undefined };

beforeEach( () => {
	mockHookRecorder.calls = [];
	mockPanelRecorder.calls = [];
	mockInheritedReturn.value = {};
	mockUseSelectImpl.fn = () => undefined;
	useSelect.mockImplementation( ( mapSelect ) => {
		// Feed mapSelect a synthetic `select()` that returns an object
		// whose methods all yield what the current test configured.
		return mapSelect(
			() => new Proxy( {}, { get: () => () => mockUseSelectImpl.fn() } )
		);
	} );
} );

// The `className` → variation-slug derivation now lives inside
// `useResolvedStyle` (mocked here) and has direct coverage in the
// `inherited-value-context` and `block-style-variation` suites. These
// tests verify that each hook wrapper calls `useResolvedStyle` with the
// block's name and forwards its return value to the shared panel via the
// `inheritedValue` prop.

describe( 'inspector hook wrappers thread inheritedValue into the panel', () => {
	test( 'TypographyPanel calls useResolvedStyle with the block name and threads inheritedValue', () => {
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

		expect( mockHookRecorder.calls ).toHaveLength( 1 );
		expect( mockHookRecorder.calls[ 0 ] ).toMatchObject( {
			blockName: 'core/paragraph',
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
	test( 'ElementsEdit wires block-scoped Global Styles into the Color panel', () => {
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

		expect( mockHookRecorder.calls[ 0 ] ).toMatchObject( {
			blockName: 'core/paragraph',
		} );
		const [ , props ] = mockPanelRecorder.calls[ 0 ];
		expect( props.inheritedValue ).toEqual( {
			elements: { link: { color: { text: '#cf2e2e' } } },
		} );
	} );

	test( 'BorderPanel threads a border-scoped inheritedValue into the panel', () => {
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

		expect( mockHookRecorder.calls[ 0 ] ).toMatchObject( {
			blockName: 'core/paragraph',
		} );
		expect( mockPanelRecorder.calls[ 0 ][ 1 ].inheritedValue ).toEqual( {
			border: { radius: '8px' },
		} );
	} );

	test( 'DimensionsPanel threads spacing inheritedValue into the panel', () => {
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

		expect( mockHookRecorder.calls[ 0 ] ).toMatchObject( {
			blockName: 'core/paragraph',
		} );
		expect( mockPanelRecorder.calls[ 0 ][ 1 ].inheritedValue ).toEqual( {
			spacing: { padding: { top: '32px' } },
		} );
	} );

	test( 'BackgroundImagePanel replaces its pre-feature partial wiring with a full inherited payload', () => {
		getBlockSupport.mockImplementation( ( _n, key ) => {
			if ( key === 'background' ) {
				return { backgroundImage: true };
			}
			return undefined;
		} );
		hasBlockSupport.mockReturnValue( true );

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

		expect( mockHookRecorder.calls[ 0 ] ).toMatchObject( {
			blockName: 'core/cover',
		} );
		expect( mockPanelRecorder.calls[ 0 ][ 1 ].inheritedValue ).toEqual( {
			background: { backgroundImage: { url: 'themed.jpg' } },
		} );
	} );

	test( 'wrappers forward the block className to useResolvedStyle', () => {
		mockUseSelectImpl.fn = () => ( {
			style: undefined,
			fontFamily: undefined,
			fontSize: undefined,
			fitText: undefined,
			className: 'is-style-plain',
		} );
		mockInheritedReturn.value = {};

		render(
			<TypographyPanel
				clientId="block-1"
				name="core/quote"
				setAttributes={ () => {} }
				settings={ { typography: { fontSize: true } } }
			/>
		);

		expect( mockHookRecorder.calls[ 0 ] ).toMatchObject( {
			blockName: 'core/quote',
			className: 'is-style-plain',
		} );
	} );

	test( 'wrappers fall back to empty inheritedValue during hydration', () => {
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
