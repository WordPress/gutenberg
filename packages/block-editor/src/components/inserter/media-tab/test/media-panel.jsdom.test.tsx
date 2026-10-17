import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import { MediaCategoryPanel } from '../media-panel';
import type { MediaCategory } from '../types';

globalThis.wpVitest.mockMatchMedia();

// Keep the panel's data + async surface out of the test: return a small,
// non-empty result set so the grid renders. The mock is a spy so tests can
// assert on the query the panel sends.
const { useMediaResults, defaultResults } = vi.hoisted( () => {
	const defaults = () => ( {
		mediaList: [
			{ id: 1, title: 'Example', url: 'https://example.com/1' },
		],
		isLoading: false,
	} );
	return {
		useMediaResults:
			vi.fn< ( ...args: unknown[] ) => Record< string, unknown > >(
				defaults
			),
		defaultResults: defaults,
	};
} );
// @ts-expect-error The stub provides only what the panel needs.
vi.mock( import( '../hooks' ), () => ( {
	useMediaResults,
} ) );

// Replace the grid with a marker that reports the actions it was given and
// lets tests drive its search and paging callbacks.
vi.mock( import( '../media-grid' ), () => ( {
	__esModule: true,
	default: ( {
		actions,
		onChangeSearch,
		onChangePage,
		page,
		footer,
		isLoading,
	} ) => (
		<div
			data-testid="media-grid"
			data-actions={ actions.map( ( action ) => action.id ).join( ',' ) }
			data-page={ page }
			data-loading={ String( isLoading ) }
		>
			<button onClick={ () => onChangeSearch( 'sunset' ) }>search</button>
			<button onClick={ () => onChangePage( 2 ) }>next page</button>
			{ footer }
		</div>
	),
} ) );

// The attach button renders through MediaUpload's render prop behind a
// capability check; stub both so the real Button (and its label) render.
vi.mock( import( '../../../media-upload' ), () => ( {
	__esModule: true,
	default: ( { render: renderProp } ) => renderProp( { open: () => {} } ),
} ) );
vi.mock( import( '../../../media-upload/check' ), () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

const baseCategory = {
	name: 'attached-images',
	labels: { name: 'Attached images', search_items: 'Search attachments' },
	mediaType: 'image',
	fetch: vi.fn(),
	attach: vi.fn(),
	detach: vi.fn(),
	invalidate: vi.fn(),
};

// A stub category, with what each test adds to the base one.
type StubCategory = typeof baseCategory & Record< string, unknown >;

// The search term lives above the panel (in `MediaTab`), so the harness
// owns it here the same way.
function PanelHarness( { category }: { category: StubCategory } ) {
	const [ search, setSearch ] = useState( '' );
	return (
		<MediaCategoryPanel
			onInsert={ vi.fn() }
			// The stub category has only what the panel reads.
			category={ category as unknown as MediaCategory }
			// The stub categories hold images.
			mediaType={ category.mediaType as MediaCategory[ 'mediaType' ] }
			search={ search }
			onChangeSearch={ setSearch }
		/>
	);
}

function renderPanel( category: StubCategory ) {
	return render( <PanelHarness category={ category } /> );
}

const getGridActions = () =>
	screen.getByTestId( 'media-grid' ).getAttribute( 'data-actions' );

beforeEach( () => {
	// Reset rather than clear, so a test's own results don't leak into the next.
	useMediaResults.mockReset();
	useMediaResults.mockImplementation( defaultResults );
} );

describe( 'MediaCategoryPanel attach/detach gating', () => {
	it( 'exposes attach and a detach action for the built-in Attachments source', () => {
		renderPanel( baseCategory );

		expect( getGridActions() ).toBe( 'detach' );
		expect(
			screen.getByRole( 'button', { name: 'Attach images' } )
		).toBeInTheDocument();
	} );

	it( 'ignores attach/detach when the source is an external resource', () => {
		// Every category registered by an extender through the public
		// `registerInserterMediaCategory` API is forced to `isExternalResource:
		// true`, so an extender-registered source cannot opt into the workflow
		// even if it sets `attach`/`detach`.
		renderPanel( { ...baseCategory, isExternalResource: true } );

		expect( getGridActions() ).toBe( '' );
		expect(
			screen.queryByRole( 'button', { name: 'Attach images' } )
		).not.toBeInTheDocument();
	} );

	it( 'offers a report action for a source with a report URL', () => {
		renderPanel( {
			...baseCategory,
			isExternalResource: true,
			getReportUrl: () => 'https://example.com/report',
		} );

		expect( getGridActions() ).toBe( 'report' );
	} );
} );

describe( 'MediaCategoryPanel subscription gating', () => {
	it( 'subscribes a local source to media changes and unsubscribes on unmount', () => {
		const unsubscribe = vi.fn();
		const subscribe = vi.fn( () => unsubscribe );

		const { unmount } = renderPanel( { ...baseCategory, subscribe } );

		// The panel hands its own query over, so the source can watch the exact
		// results the grid is showing.
		expect( subscribe ).toHaveBeenCalledTimes( 1 );
		expect( subscribe ).toHaveBeenCalledWith(
			expect.any( Function ),
			expect.objectContaining( { per_page: expect.any( Number ) } )
		);
		expect( unsubscribe ).not.toHaveBeenCalled();

		unmount();

		expect( unsubscribe ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'ignores subscribe when the source is an external resource', () => {
		// `subscribe` is core-only, gated like `attach`/`detach`: an
		// extender-registered source is always external, so it cannot hook into
		// the panel's refresh cycle just by setting the prop.
		const subscribe = vi.fn();

		renderPanel( { ...baseCategory, subscribe, isExternalResource: true } );

		expect( subscribe ).not.toHaveBeenCalled();
	} );
} );

describe( 'MediaCategoryPanel querying', () => {
	// The panel has rendered, so the hook was called.
	const lastQuery = () => useMediaResults.mock.lastCall![ 1 ];

	it( 'queries with the search term and page the grid reports', async () => {
		const user = userEvent.setup();
		renderPanel( baseCategory );

		expect( lastQuery() ).toEqual(
			expect.objectContaining( { page: 1, search: '' } )
		);

		await user.click( screen.getByRole( 'button', { name: 'next page' } ) );
		expect( lastQuery() ).toEqual( expect.objectContaining( { page: 2 } ) );
		expect( screen.getByTestId( 'media-grid' ) ).toHaveAttribute(
			'data-page',
			'2'
		);

		// A new search restarts from the first page.
		await user.click( screen.getByRole( 'button', { name: 'search' } ) );
		expect( lastQuery() ).toEqual(
			expect.objectContaining( { page: 1, search: 'sunset' } )
		);
	} );

	it( 'reports the grid as idle while switching source, even mid-fetch', () => {
		// A fetch is already in flight (paging, say) when another source is
		// asked for, so `isLoading` never falls back to false on its own.
		useMediaResults.mockReturnValue( {
			mediaList: [],
			isLoading: true,
			isSwitchingSource: true,
		} );
		renderPanel( baseCategory );

		expect( screen.getByTestId( 'media-grid' ) ).toHaveAttribute(
			'data-loading',
			'false'
		);
	} );

	it( 'reports the grid as loading while refetching the current source', () => {
		useMediaResults.mockReturnValue( {
			mediaList: [ { id: 1, url: 'https://example.com/1' } ],
			isLoading: true,
			isSwitchingSource: false,
		} );
		renderPanel( baseCategory );

		expect( screen.getByTestId( 'media-grid' ) ).toHaveAttribute(
			'data-loading',
			'true'
		);
	} );
} );
