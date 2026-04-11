/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import PostUploadIndicator from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

function mockSummary( summary ) {
	useSelect.mockImplementation( ( cb ) =>
		cb( () => ( {
			getUploadProgressSummary: () => summary,
		} ) )
	);
}

describe( 'PostUploadIndicator', () => {
	const originalFlag = window.__clientSideMediaProcessing;

	beforeEach( () => {
		window.__clientSideMediaProcessing = true;
		speak.mockClear();
	} );

	afterAll( () => {
		window.__clientSideMediaProcessing = originalFlag;
	} );

	it( 'renders nothing when the upload queue is empty', () => {
		mockSummary( null );
		const { container } = render( <PostUploadIndicator /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when client-side media processing is disabled', () => {
		window.__clientSideMediaProcessing = false;
		mockSummary( {
			total: 2,
			completed: 0,
			progress: 0,
			currentFilename: 'foo.jpg',
		} );
		const { container } = render( <PostUploadIndicator /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows the label, count and filename when uploading', () => {
		mockSummary( {
			total: 10,
			completed: 3,
			progress: 30,
			currentFilename: 'kitten.jpg',
		} );
		render( <PostUploadIndicator /> );
		expect( screen.getByText( 'Uploading' ) ).toBeVisible();
		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			'3 / 10 — kitten.jpg'
		);
	} );

	it( 'omits the filename when none is provided', () => {
		mockSummary( {
			total: 1,
			completed: 0,
			progress: 0,
		} );
		render( <PostUploadIndicator /> );
		const status = screen.getByRole( 'status' );
		expect( status ).toHaveTextContent( '0 / 1' );
		expect( status ).not.toHaveTextContent( /—/ );
	} );

	it( 'gives the progress bar a descriptive aria-label with counts and filename', () => {
		mockSummary( {
			total: 5,
			completed: 2,
			progress: 40,
			currentFilename: 'photo.png',
		} );
		render( <PostUploadIndicator /> );
		expect(
			screen.getByRole( 'progressbar', {
				name: /Uploading media: 2 of 5, currently photo\.png/,
			} )
		).toBeInTheDocument();
	} );

	it( 'announces start and completion via speak()', () => {
		mockSummary( null );
		const { rerender } = render( <PostUploadIndicator /> );
		expect( speak ).not.toHaveBeenCalled();

		mockSummary( {
			total: 2,
			completed: 0,
			progress: 0,
			currentFilename: 'a.jpg',
		} );
		rerender( <PostUploadIndicator /> );
		expect( speak ).toHaveBeenCalledWith(
			'Media upload started',
			'polite'
		);

		mockSummary( null );
		rerender( <PostUploadIndicator /> );
		expect( speak ).toHaveBeenCalledWith(
			'Media upload complete',
			'polite'
		);
	} );
} );
