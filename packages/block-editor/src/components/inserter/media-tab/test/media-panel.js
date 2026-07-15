/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { MediaCategoryPanel } from '../media-panel';

// Keep the panel's data + async surface out of the test: return a small,
// non-empty result set so the grid (and the detach affordance) render.
jest.mock( '../hooks', () => ( {
	useMediaResults: () => ( {
		mediaList: [
			{ id: 1, title: 'Example', url: 'https://example.com/1' },
		],
		isLoading: false,
	} ),
	useDelayedLoading: () => false,
} ) );

// Replace `MediaList` with a marker that only reports whether it was wired for
// detach, so the gate can be asserted without the full preview/dropdown tree.
jest.mock( '../media-list', () => ( {
	__esModule: true,
	default: ( { onDetach } ) => (
		<div
			data-testid="media-list"
			data-has-detach={ String( !! onDetach ) }
		/>
	),
} ) );

// The attach button renders through MediaUpload's render prop behind a
// capability check; stub both so the real Button (and its label) render.
jest.mock( '../../../media-upload', () => ( {
	__esModule: true,
	default: ( { render: renderProp } ) => renderProp( { open: () => {} } ),
} ) );
jest.mock( '../../../media-upload/check', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

const baseCategory = {
	name: 'attached-images',
	labels: { name: 'Attached images', search_items: 'Search attachments' },
	mediaType: 'image',
	fetch: jest.fn(),
	attach: jest.fn(),
	detach: jest.fn(),
	invalidate: jest.fn(),
};

function renderPanel( category ) {
	return render(
		<MediaCategoryPanel
			rootClientId=""
			onInsert={ jest.fn() }
			category={ category }
		/>
	);
}

describe( 'MediaCategoryPanel attach/detach gating', () => {
	it( 'exposes attach/detach for the built-in Attachments source', () => {
		renderPanel( baseCategory );

		expect(
			screen.getByRole( 'button', { name: 'Attach images' } )
		).toBeInTheDocument();
		expect( screen.getByTestId( 'media-list' ) ).toHaveAttribute(
			'data-has-detach',
			'true'
		);
	} );

	it( 'ignores attach/detach when the source is an external resource', () => {
		// Every category registered by an extender through the public
		// `registerInserterMediaCategory` API is forced to `isExternalResource:
		// true`, so an extender-registered source cannot opt into the workflow
		// even if it sets `attach`/`detach`.
		renderPanel( { ...baseCategory, isExternalResource: true } );

		expect(
			screen.queryByRole( 'button', { name: 'Attach images' } )
		).not.toBeInTheDocument();
		expect( screen.getByTestId( 'media-list' ) ).toHaveAttribute(
			'data-has-detach',
			'false'
		);
	} );
} );

describe( 'MediaCategoryPanel subscription gating', () => {
	it( 'subscribes a local source to media changes and unsubscribes on unmount', () => {
		const unsubscribe = jest.fn();
		const subscribe = jest.fn( () => unsubscribe );

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
		const subscribe = jest.fn();

		renderPanel( { ...baseCategory, subscribe, isExternalResource: true } );

		expect( subscribe ).not.toHaveBeenCalled();
	} );
} );
