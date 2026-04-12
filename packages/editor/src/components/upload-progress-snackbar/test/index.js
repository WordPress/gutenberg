/**
 * External dependencies
 */
import { render } from '@testing-library/react';

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

const mockCreateNotice = jest.fn();
const mockRemoveNotice = jest.fn();

jest.mock( '@wordpress/data/src/components/use-dispatch', () => {
	return {
		useDispatch: jest.fn( () => ( {
			createNotice: mockCreateNotice,
			removeNotice: mockRemoveNotice,
		} ) ),
		useDispatchWithMap: jest.fn(),
	};
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

function makeItem( id, name, { parentId } = {} ) {
	return {
		id,
		sourceFile: { name },
		status: 'PROCESSING',
		parentId,
	};
}

describe( 'UploadProgressSnackbar', () => {
	const originalFlag = window.__clientSideMediaProcessing;

	beforeEach( () => {
		window.__clientSideMediaProcessing = true;
		jest.clearAllMocks();
	} );

	afterEach( () => {
		window.__clientSideMediaProcessing = originalFlag;
	} );

	it( 'does not create a notice when the feature flag is off', () => {
		window.__clientSideMediaProcessing = false;
		mockQueue( [] );
		render( <UploadProgressSnackbar /> );
		expect( mockCreateNotice ).not.toHaveBeenCalled();
	} );

	it( 'does not create a notice when the upload queue is empty', () => {
		mockQueue( [] );
		render( <UploadProgressSnackbar /> );
		expect( mockCreateNotice ).not.toHaveBeenCalled();
	} );

	it( 'creates a notice with the filename when a single file is uploading', () => {
		mockQueue( [ makeItem( '1', 'photo.jpg' ) ] );
		render( <UploadProgressSnackbar /> );
		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'info',
			expect.stringContaining( 'photo.jpg' ),
			expect.objectContaining( {
				id: 'upload-progress',
				type: 'snackbar',
			} )
		);
		// "Uploading 1 of 1"
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toMatch( /1 of 1/ );
	} );

	it( 'creates a notice with count when a batch is uploading', () => {
		mockQueue( [
			makeItem( '1', 'a.jpg' ),
			makeItem( '2', 'b.jpg' ),
			makeItem( '3', 'c.jpg' ),
		] );
		render( <UploadProgressSnackbar /> );
		// "Uploading 1 of 3 — a.jpg"
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toMatch( /1 of 3/ );
	} );

	it( 'excludes subsizes from the count', () => {
		mockQueue( [
			makeItem( '1', 'photo.jpg' ),
			makeItem( '1-thumb', 'photo-150x150.jpg', { parentId: '1' } ),
			makeItem( '1-medium', 'photo-300x300.jpg', { parentId: '1' } ),
		] );
		render( <UploadProgressSnackbar /> );
		// Only 1 original, so "Uploading 1 of 1"
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toMatch( /1 of 1/ );
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toMatch( /photo\.jpg/ );
	} );
} );
