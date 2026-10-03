import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useResolvedStyle } from '../inherited-value-context';
import { globalStylesDataKey } from '../../../store/private-keys';

// Coverage for `useResolvedStyle` with the inheritance indicator experiment
// off, which is what WordPress Core gets. The cascade resolves either way: the
// experiment gates the label treatment and the reset dot, not the values.
// Only `useSelect` is called by the hook. The other four are needed at import
// time by the store modules this file pulls in transitively.
vi.mock( import( '@wordpress/data' ), () => ( {
	useSelect: vi.fn(),
	register: vi.fn(),
	createReduxStore: vi.fn(),
	createSelector: vi.fn( ( callback ) => callback ),
	combineReducers: vi.fn( ( reducers ) => reducers ),
} ) );

vi.mock( import( '../../../store' ), () => ( {
	store: { name: 'core/block-editor' },
} ) );

// `inherited-value-context.jsx` imports the blocks store for
// `useVariationAndElements`. Its real import chain needs data-module exports
// the stub above does not provide, so stub the blocks module too.
vi.mock( import( '@wordpress/blocks' ), () => ( {
	store: { name: 'core/blocks' },
	getBlockType: ( blockName ) =>
		( { 'core/heading': { title: 'Heading' } } )[ blockName ],
} ) );

vi.mock( import( '../../../hooks/block-style-variation' ), () => ( {
	getVariationNameFromClass: ( className ) => {
		const match = /is-style-([\w-]+)/.exec( className || '' );
		return match ? match[ 1 ] : null;
	},
} ) );

describe( 'useResolvedStyle with the indicator experiment off', () => {
	beforeEach( () => {
		useSelect.mockReset();
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getSettings: () => ( {
					// Root, block and element layers, all three of
					// which must reach the resolved value.
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

	it( 'resolves the root, block and element layers', () => {
		const { result } = renderHook( () =>
			useResolvedStyle( 'core/heading', 'is-style-fancy' )
		);

		expect( result.current.value ).toEqual( {
			typography: { lineHeight: '1.6', fontSize: '24px' },
			// The `h2` layer applies to this level-2 Heading, so its color
			// both flattens onto the block and stays available as the
			// element passthrough.
			color: { text: '#111111' },
			elements: { h2: { color: { text: '#111111' } } },
		} );
		expect( result.current.sources ).toBeDefined();
	} );
} );
