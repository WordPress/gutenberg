import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { act, render } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import type { ComponentType } from 'react';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { optimizeFitText } from '../../utils/fit-text-utils';
import '../fit-text';
import type { BlockEditHookProps } from '../types';

const mockBlockElement = document.createElement( 'p' );
document.body.appendChild( mockBlockElement );

vi.mock(
	import( '../../components/block-list/use-block-props/use-block-refs' ),
	() => ( {
		useBlockElement: () => mockBlockElement,
	} )
);

vi.mock( import( '../../utils/fit-text-utils' ), () => ( {
	optimizeFitText: vi.fn( () => 32 ),
} ) );

const BLOCK_NAME = 'test/fit-text';

function Edit() {
	return null;
}

// The hook is applied through the `editor.BlockEdit` filter.
const FilteredEdit = applyFilters(
	'editor.BlockEdit',
	Edit
) as ComponentType< BlockEditHookProps >;

// Fit text blocks also support font sizes. Declaring it keeps this object
// assignable to the blocks types, which don't list `fitText` yet.
const supports = { typography: { fontSize: true, fitText: true } };

function setup() {
	const registry = createRegistry();
	registry.register( blocksStore );
	registry.register( blockEditorStore );
	const block = createBlock( BLOCK_NAME, {
		content: 'Hello',
		fitText: true,
	} );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );

	render(
		<RegistryProvider value={ registry }>
			<FilteredEdit
				name={ BLOCK_NAME }
				clientId={ block.clientId }
				attributes={ block.attributes }
				setAttributes={ () => {} }
				isSelected={ false }
			/>
		</RegistryProvider>
	);

	// Let the initial (deferred) calculation run.
	act( () => {
		vi.advanceTimersByTime( 100 );
	} );
	vi.mocked( optimizeFitText ).mockClear();

	return registry;
}

describe( 'fit text', () => {
	beforeAll( () => {
		registerBlockType( BLOCK_NAME, {
			apiVersion: 3,
			title: 'Fit text test',
			category: 'text',
			attributes: {
				content: { type: 'string' },
				fitText: { type: 'boolean' },
			},
			supports,
			edit: Edit,
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( BLOCK_NAME );
	} );

	beforeEach( () => {
		vi.useFakeTimers();
	} );

	afterEach( () => {
		vi.useRealTimers();
		vi.mocked( optimizeFitText ).mockClear();
	} );

	it( 'recalculates the font size when the editor styles change', () => {
		const registry = setup();

		act( () => {
			registry.dispatch( blockEditorStore ).updateSettings( {
				styles: [
					{
						css: 'body { font-family: serif; }',
						isGlobalStyles: true,
					},
				],
			} );
		} );
		act( () => {
			vi.advanceTimersByTime( 100 );
		} );

		expect( optimizeFitText ).toHaveBeenCalledWith(
			mockBlockElement,
			expect.any( Function )
		);
	} );

	it( 'recalculates the font size when style overrides change', () => {
		const registry = setup();

		act( () => {
			unlock( registry.dispatch( blockEditorStore ) ).setStyleOverride(
				'test-override',
				{ css: 'p { font-family: monospace; }' }
			);
		} );
		act( () => {
			vi.advanceTimersByTime( 100 );
		} );

		expect( optimizeFitText ).toHaveBeenCalled();
	} );

	it( 'does not recalculate when unrelated settings change', () => {
		const registry = setup();

		act( () => {
			registry
				.dispatch( blockEditorStore )
				.updateSettings( { hasFixedToolbar: true } );
		} );
		act( () => {
			vi.advanceTimersByTime( 100 );
		} );

		expect( optimizeFitText ).not.toHaveBeenCalled();
	} );

	it( 'recalculates the font size when web fonts finish loading', () => {
		const fonts = new EventTarget();
		Object.defineProperty( document, 'fonts', {
			value: fonts,
			configurable: true,
		} );

		try {
			setup();

			act( () => {
				fonts.dispatchEvent( new Event( 'loadingdone' ) );
			} );

			expect( optimizeFitText ).toHaveBeenCalledWith(
				mockBlockElement,
				expect.any( Function )
			);
		} finally {
			// @ts-expect-error Removing the stub added above.
			delete document.fonts;
		}
	} );
} );
