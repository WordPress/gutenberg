/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import UploadProgressSnackbar from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/a11y', () => ( {
	speak: jest.fn(),
} ) );

function mockQueue( items ) {
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getItems: () => items,
			isUploading: () => items.length > 0,
		} ) )
	);
}

describe( 'UploadProgressSnackbar', () => {
	const originalFlag = window.__clientSideMediaProcessing;

	beforeEach( () => {
		window.__clientSideMediaProcessing = true;
	} );

	afterEach( () => {
		window.__clientSideMediaProcessing = originalFlag;
		jest.clearAllMocks();
	} );

	it( 'renders nothing when the client-side media processing flag is off', () => {
		window.__clientSideMediaProcessing = false;
		mockQueue( [] );
		const { container } = render( <UploadProgressSnackbar /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when the upload queue is empty', () => {
		mockQueue( [] );
		const { container } = render( <UploadProgressSnackbar /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows the source filename when a single file is uploading', () => {
		mockQueue( [
			{
				id: '1',
				sourceFile: { name: 'photo.jpg' },
				status: 'PROCESSING',
			},
		] );
		render( <UploadProgressSnackbar /> );
		expect( screen.getByText( /photo\.jpg/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0 / 1' );
	} );

	it( 'shows an "Uploading N files" label when a batch is uploading', () => {
		mockQueue( [
			{ id: '1', sourceFile: { name: 'a.jpg' }, status: 'PROCESSING' },
			{ id: '2', sourceFile: { name: 'b.jpg' }, status: 'QUEUED' },
			{ id: '3', sourceFile: { name: 'c.jpg' }, status: 'QUEUED' },
		] );
		render( <UploadProgressSnackbar /> );
		expect( screen.getByText( /Uploading 3 files/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0 / 3' );
	} );
} );
