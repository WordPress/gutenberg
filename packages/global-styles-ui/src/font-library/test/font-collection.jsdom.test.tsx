import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import { useEntityRecord } from '@wordpress/core-data';
import FontCollection from '../font-collection';
import { FontLibraryContext } from '../context';
import type { FontLibraryState } from '../types';

globalThis.wpVitest.mockMatchMedia();

vi.mock( import( '@wordpress/a11y' ), () => ( {
	speak: vi.fn() as never,
} ) );
vi.mock( import( '@wordpress/core-data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useEntityRecord: vi.fn() as never,
} ) );
vi.mock( import( '../font-card' ), () => ( {
	default: ( () => null ) as never,
} ) );

function makeFont( name: string, category: string ) {
	const slug = name.toLowerCase().replace( / /g, '-' );
	return {
		font_family_settings: {
			name,
			slug,
			fontFamily: name,
			fontFace: [],
		},
		categories: [ category ],
	};
}

const collection = {
	slug: 'test-collection',
	name: 'Test collection',
	description: '',
	categories: [
		{ name: 'Serif', slug: 'serif' },
		{ name: 'Monospace', slug: 'monospace' },
	],
	font_families: [
		makeFont( 'Roboto Serif', 'serif' ),
		makeFont( 'Noto Serif', 'serif' ),
		makeFont( 'Roboto Mono', 'monospace' ),
	],
};

function renderFontCollection() {
	return render(
		<FontLibraryContext.Provider
			value={
				{
					installFonts: vi.fn(),
					isInstalling: false,
					baseCustomFonts: [],
				} as unknown as FontLibraryState
			}
		>
			<FontCollection slug="test-collection" />
		</FontLibraryContext.Provider>
	);
}

describe( 'FontCollection', () => {
	beforeEach( () => {
		vi.mocked( speak ).mockClear();
		vi.mocked( useEntityRecord ).mockReturnValue( {
			record: collection,
			isResolving: false,
		} as never );
	} );

	it( 'does not announce results before the list is filtered', () => {
		renderFontCollection();

		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'announces the number of fonts matching a search', async () => {
		renderFontCollection();

		fireEvent.change( screen.getByRole( 'searchbox' ), {
			target: { value: 'roboto' },
		} );

		await waitFor( () =>
			expect( speak ).toHaveBeenCalledWith( '2 fonts found.' )
		);
		expect( speak ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'announces when a search matches no fonts', async () => {
		renderFontCollection();

		fireEvent.change( screen.getByRole( 'searchbox' ), {
			target: { value: 'helvetica' },
		} );

		await waitFor( () =>
			expect( speak ).toHaveBeenCalledWith(
				'No fonts found. Try with a different search term.'
			)
		);
	} );
} );
