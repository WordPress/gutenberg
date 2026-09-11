import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaCategoryPanel } from '../media-panel';

globalThis.wpVitest.mockMatchMedia();

// Keep the panel's data + async surface out of the test: return a small,
// non-empty result set so the grid renders. The mock is a spy so tests can
// assert on the query the panel sends.
const { useMediaResults } = vi.hoisted( () => ( {
	useMediaResults: vi.fn( () => ( {
		mediaList: [
			{ id: 1, title: 'Example', url: 'https://example.com/1' },
		],
		isLoading: false,
	} ) ),
} ) );
vi.mock( import( '../hooks' ), () => ( {
	useMediaResults,
} ) );

// Replace the grid with a marker that reports the actions it was given and
// lets tests drive its search and paging callbacks; the filters and footer it
// receives render through so their controls can be exercised.
vi.mock( import( '../media-grid' ), () => ( {
	__esModule: true,
	default: ( {
		actions,
		onChangeSearch,
		onChangePage,
		page,
		filters,
		footer,
	} ) => (
		<div
			data-testid="media-grid"
			data-actions={ actions.map( ( action ) => action.id ).join( ',' ) }
			data-page={ page }
		>
			<button onClick={ () => onChangeSearch( 'sunset' ) }>search</button>
			<button onClick={ () => onChangePage( 2 ) }>next page</button>
			{ filters }
			{ footer }
		</div>
	),
} ) );

// Replace the folder select with a marker that lists the folders and lets
// tests pick one, so the design-system popup isn't part of the test.
vi.mock( import( '../folder-select' ), () => ( {
	__esModule: true,
	default: ( { folders, value, onChange, onCreate } ) => (
		<div
			data-testid="folder-select"
			data-folders={ folders
				.map( ( folder ) => folder.name )
				.join( ',' ) }
			data-value={ String( value ) }
			data-can-create={ String( !! onCreate ) }
		>
			<button onClick={ () => onChange( 7 ) }>choose Holiday</button>
		</div>
	),
} ) );

// The picker button renders through MediaUpload's render prop behind a
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

const mediaFolders = {
	folders: [
		{ id: 7, name: 'Holiday' },
		{ id: 8, name: 'Product shots' },
	],
	canCreate: true,
	create: vi.fn(),
};

function renderPanel( category, props ) {
	return render(
		<MediaCategoryPanel
			onInsert={ vi.fn() }
			category={ category }
			{ ...props }
		/>
	);
}

const getGridActions = () =>
	screen.getByTestId( 'media-grid' ).getAttribute( 'data-actions' );
const lastQuery = () => useMediaResults.mock.lastCall[ 1 ];

beforeEach( () => {
	useMediaResults.mockClear();
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
} );

describe( 'MediaCategoryPanel media folders', () => {
	const folderCategory = {
		...baseCategory,
		supportsFolders: true,
		assignToFolder: vi.fn(),
		removeFromFolder: vi.fn(),
	};

	it( 'offers no folder UI without the host capability or source support', () => {
		const { unmount } = renderPanel( folderCategory );
		expect(
			screen.queryByTestId( 'folder-select' )
		).not.toBeInTheDocument();
		unmount();

		renderPanel( baseCategory, { mediaFolders } );
		expect(
			screen.queryByTestId( 'folder-select' )
		).not.toBeInTheDocument();
		expect( lastQuery().folder ).toBeUndefined();
	} );

	it( 'filters by the chosen folder from the first page and swaps the footer action', async () => {
		const user = userEvent.setup();
		renderPanel( folderCategory, { mediaFolders } );

		const folderSelect = screen.getByTestId( 'folder-select' );
		expect( folderSelect ).toHaveAttribute(
			'data-folders',
			'Holiday,Product shots'
		);
		expect( folderSelect ).toHaveAttribute( 'data-can-create', 'true' );
		expect( lastQuery() ).toEqual(
			expect.objectContaining( { folder: undefined } )
		);
		expect(
			screen.getByRole( 'button', { name: 'Attach images' } )
		).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'next page' } ) );
		await user.click(
			screen.getByRole( 'button', { name: 'choose Holiday' } )
		);

		expect( lastQuery() ).toEqual(
			expect.objectContaining( { page: 1, folder: 7 } )
		);
		expect(
			screen.getByRole( 'button', { name: 'Add to folder' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Attach images' } )
		).not.toBeInTheDocument();
	} );

	it( 'hides folder creation when the user may not create folders', () => {
		renderPanel( folderCategory, {
			mediaFolders: { ...mediaFolders, canCreate: false },
		} );

		expect( screen.getByTestId( 'folder-select' ) ).toHaveAttribute(
			'data-can-create',
			'false'
		);
	} );
} );
