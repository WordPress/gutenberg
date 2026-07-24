/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useResolvedStyle } from '../inherited-value-context';
import { globalStylesDataKey } from '../../../store/private-keys';

// Core-build coverage for `useResolvedStyle`. Tests run with
// `IS_GUTENBERG_PLUGIN` true, so the core path needs a mock. `jest.mock` is
// file-scoped, so these tests live apart from `inherited-value-context.js`.
jest.mock( '../inheritance', () => ( {
	...jest.requireActual( '../inheritance' ),
	ENABLE_GLOBAL_STYLES_INHERITANCE: false,
} ) );

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

describe( 'useResolvedStyle — core build', () => {
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
