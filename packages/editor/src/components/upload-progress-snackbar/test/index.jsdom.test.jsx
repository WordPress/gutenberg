import { render, act } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import UploadProgressSnackbar from '../';
import { lock } from '../../../lock-unlock';
import { addFiles, advance, advanceFailed, reset } from '../tracker';

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

function mockQueue( items, failureCount = 0 ) {
	const storeSelect = {
		getItems: () => items,
		isUploading: () => items.length > 0,
	};
	// `getFailureCount` is a private selector, so the component reads it
	// through `unlock`.
	lock( storeSelect, { getFailureCount: () => failureCount } );
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => storeSelect )
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

	it( 'shows a completion notice and then removes it when uploads finish', () => {
		jest.useFakeTimers();
		try {
			mockQueue( [] );
			act( () => {
				addFiles( [ 'a.jpg' ] );
			} );
			render( <UploadProgressSnackbar /> );
			expect( mockCreateNotice ).toHaveBeenCalled();
			mockCreateNotice.mockClear();

			act( () => {
				advance( 1 );
			} );

			// Completion notice replaces the progress notice (same ID).
			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Upload complete',
				expect.objectContaining( {
					id: 'upload-progress',
					type: 'snackbar',
					icon: expect.anything(),
				} )
			);
			expect( mockRemoveNotice ).not.toHaveBeenCalled();

			act( () => {
				jest.runAllTimers();
			} );

			expect( mockRemoveNotice ).toHaveBeenCalledWith(
				'upload-progress'
			);
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'announces completion when every upload succeeded', () => {
		mockQueue( [] );
		act( () => {
			addFiles( [ 'a.jpg' ] );
		} );
		render( <UploadProgressSnackbar /> );
		speak.mockClear();

		act( () => {
			advance( 1 );
		} );

		expect( speak ).toHaveBeenCalledWith(
			'Media upload complete',
			'polite'
		);
	} );

	it( 'does not show a completion notice when every tracked upload failed', () => {
		mockQueue( [] );
		act( () => {
			addFiles( [ 'broken.heic' ] );
		} );
		render( <UploadProgressSnackbar /> );
		mockCreateNotice.mockClear();

		act( () => {
			advanceFailed( 1 );
		} );

		expect( mockCreateNotice ).not.toHaveBeenCalled();
		// The in-progress notice has to come down, since nothing replaces it.
		expect( mockRemoveNotice ).toHaveBeenCalledWith( 'upload-progress' );
		// Claiming completion here is the bug this fixes, for screen readers too.
		expect( speak ).toHaveBeenCalledWith( 'Media upload failed', 'polite' );
		expect( speak ).not.toHaveBeenCalledWith(
			'Media upload complete',
			'polite'
		);
	} );

	it( 'reports how many files uploaded when only some of them failed', () => {
		mockQueue( [] );
		act( () => {
			addFiles( [ 'a.jpg', 'broken.heic', 'c.jpg' ] );
		} );
		render( <UploadProgressSnackbar /> );
		mockCreateNotice.mockClear();

		act( () => {
			advance( 1 );
		} );
		act( () => {
			advanceFailed( 1 );
		} );
		mockCreateNotice.mockClear();
		act( () => {
			advance( 1 );
		} );

		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'info',
			'Uploaded 2 of 3',
			expect.objectContaining( {
				id: 'upload-progress',
				// A checkmark would overstate a batch that partly failed.
				icon: undefined,
			} )
		);
		// The announcement has to say the same thing the notice says.
		expect( speak ).toHaveBeenCalledWith( 'Uploaded 2 of 3', 'polite' );
		expect( speak ).not.toHaveBeenCalledWith(
			'Media upload complete',
			'polite'
		);
	} );

	it( 'does not show a completion notice when every CSM upload failed', () => {
		mockQueue( [ makeItem( '1', 'broken.heic' ) ] );
		const { rerender } = render( <UploadProgressSnackbar /> );
		mockCreateNotice.mockClear();

		// The queue empties on failure exactly as it does on success — the
		// failure tally is the only thing that tells them apart.
		mockQueue( [], 1 );
		rerender( <UploadProgressSnackbar /> );

		expect( mockCreateNotice ).not.toHaveBeenCalled();
		expect( mockRemoveNotice ).toHaveBeenCalledWith( 'upload-progress' );
	} );

	it( 'ignores failures from earlier batches', () => {
		// A previous batch already failed once, so the tally starts above zero.
		mockQueue( [ makeItem( '1', 'photo.jpg' ) ], 1 );
		const { rerender } = render( <UploadProgressSnackbar /> );
		mockCreateNotice.mockClear();

		mockQueue( [], 1 );
		rerender( <UploadProgressSnackbar /> );

		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'info',
			'Upload complete',
			expect.objectContaining( { id: 'upload-progress' } )
		);
	} );

	it( 'middle-truncates a long filename while keeping the extension', () => {
		const longName =
			'a-really-long-uuid-like-filename-1234567890-abcdefghij.jpg';
		mockQueue( [ makeItem( '1', longName ) ] );
		render( <UploadProgressSnackbar /> );
		const content = mockCreateNotice.mock.calls[ 0 ][ 1 ];
		// Truncated: shorter than the original, marked with an ellipsis, and the
		// extension is still visible.
		expect( content ).toContain( '…' );
		expect( content ).not.toContain( longName );
		expect( content ).toMatch( /\.jpg$/ );
	} );

	it( 'does not truncate a short filename', () => {
		mockQueue( [ makeItem( '1', 'photo.jpg' ) ] );
		render( <UploadProgressSnackbar /> );
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toBe(
			'Uploading — photo.jpg'
		);
	} );

	it( 'includes a spinner icon on the in-progress notice', () => {
		mockQueue( [ makeItem( '1', 'photo.jpg' ) ] );
		render( <UploadProgressSnackbar /> );
		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'info',
			expect.any( String ),
			expect.objectContaining( {
				icon: expect.anything(),
			} )
		);
	} );
} );
