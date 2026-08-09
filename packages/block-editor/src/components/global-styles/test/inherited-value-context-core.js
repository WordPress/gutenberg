import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useResolvedStyle } from '../inherited-value-context';
import { globalStylesDataKey } from '../../../store/private-keys';

// Coverage for `useResolvedStyle` with the `gutenberg-global-styles-inheritance-ui`
// experiment off, which is what WordPress Core gets. Deleted rather than set to
// `false`, because an experiment that was never turned on leaves the global
// unset, and `undefined` is the value that fires a receiving component's own
// default parameter. Setting `false` here would test a state that does not
// occur.
beforeEach( () => {
	delete window.__experimentalGlobalStylesInheritanceUI;
} );

afterEach( () => {
	delete window.__experimentalGlobalStylesInheritanceUI;
} );

// Only `useSelect` is called by the hook. The other four are needed at import
// time by the store modules this file pulls in transitively.
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	register: jest.fn(),
	createReduxStore: jest.fn(),
	createSelector: jest.fn( ( callback ) => callback ),
	combineReducers: jest.fn( ( reducers ) => reducers ),
} ) );

jest.mock( '../../../store', () => ( {
	store: { name: 'core/block-editor' },
} ) );

// `inherited-value-context.js` imports the blocks store for
// `useVariationAndElements`. Its real import chain needs data-module exports
// the stub above does not provide, so stub the blocks module too.
jest.mock( '@wordpress/blocks', () => ( {
	store: { name: 'core/blocks' },
	getBlockType: ( blockName ) =>
		( { 'core/heading': { title: 'Heading' } } )[ blockName ],
} ) );

jest.mock( '../../../hooks/block-style-variation', () => ( {
	getVariationNameFromClass: ( className ) => {
		const match = /is-style-([\w-]+)/.exec( className || '' );
		return match ? match[ 1 ] : null;
	},
} ) );

describe( 'useResolvedStyle — experiment off', () => {
	beforeEach( () => {
		useSelect.mockReset();
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getSettings: () => ( {
					// Root, block and element layers that the plugin path
					// would resolve into a non-empty value for `core/heading`.
					// The core path must ignore all of them.
					[ globalStylesDataKey ]: {
						typography: { lineHeight: '1.6' },
						blocks: {
							'core/heading': {
								typography: { fontSize: '24px' },
							},
						},
						elements: { h2: { color: { text: '#111111' } } },
					},
				} ),
				getBlockStyles: () => [],
				getBlockAttributes: () => ( { level: 2 } ),
			} ) )
		);
	} );

	// The hook must return undefined rather than an empty object. An empty
	// object would still be passed down as `inheritedValue`, whereas undefined
	// lets each panel apply its `inheritedValue = value` default. That default
	// is what keeps core showing locally-set values only.
	it( 'resolves nothing, so panels fall back to their `inheritedValue = value` default', () => {
		const { result } = renderHook( () =>
			useResolvedStyle( 'core/heading', 'is-style-fancy' )
		);

		expect( result.current.value ).toBeUndefined();
		expect( result.current.sources ).toBeUndefined();
	} );
} );
