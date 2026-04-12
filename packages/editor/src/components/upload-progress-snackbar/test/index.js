/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import UploadProgressSnackbar from '../';
import { addFiles, advance, reset } from '../tracker';

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
	beforeEach( () => {
		jest.clearAllMocks();
		reset();
	} );

	it( 'does not create a notice when both sources are empty', () => {
		mockQueue( [] );
		render( <UploadProgressSnackbar /> );
		expect( mockCreateNotice ).not.toHaveBeenCalled();
	} );

	it( 'creates a notice with the filename when a single CSM upload is in progress', () => {
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
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toBe(
			'Uploading — photo.jpg'
		);
	} );

	it( 'shows batch count for CSM uploads', () => {
		mockQueue( [
			makeItem( '1', 'a.jpg' ),
			makeItem( '2', 'b.jpg' ),
			makeItem( '3', 'c.jpg' ),
		] );
		render( <UploadProgressSnackbar /> );
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toMatch( /1 of 3/ );
	} );

	it( 'excludes subsizes from the CSM count', () => {
		mockQueue( [
			makeItem( '1', 'photo.jpg' ),
			makeItem( '1-thumb', 'photo-150x150.jpg', { parentId: '1' } ),
			makeItem( '1-medium', 'photo-300x300.jpg', { parentId: '1' } ),
		] );
		render( <UploadProgressSnackbar /> );
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toBe(
			'Uploading — photo.jpg'
		);
	} );

	it( 'shows non-CSM uploads tracked by the editor mediaUpload wrapper', () => {
		mockQueue( [] );
		act( () => {
			addFiles( [ 'traditional.jpg' ] );
		} );
		render( <UploadProgressSnackbar /> );
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toBe(
			'Uploading — traditional.jpg'
		);
	} );

	it( 'shows batch count for non-CSM uploads', () => {
		mockQueue( [] );
		act( () => {
			addFiles( [ 'a.jpg', 'b.jpg', 'c.jpg' ] );
		} );
		render( <UploadProgressSnackbar /> );
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toMatch( /1 of 3/ );
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toMatch( /a\.jpg/ );
	} );

	it( 'removes the notice when all tracked uploads finish', () => {
		mockQueue( [] );
		act( () => {
			addFiles( [ 'a.jpg' ] );
		} );
		render( <UploadProgressSnackbar /> );
		expect( mockCreateNotice ).toHaveBeenCalled();
		act( () => {
			advance( 1 );
		} );
		expect( mockRemoveNotice ).toHaveBeenCalledWith( 'upload-progress' );
	} );
} );
