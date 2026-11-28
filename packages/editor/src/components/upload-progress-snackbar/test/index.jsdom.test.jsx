import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import UploadProgressSnackbar from '../';
import { lock } from '../../../lock-unlock';
import { addFiles, advance, advanceFailed, reset } from '../tracker';

const mockCreateNotice = vi.fn();
const mockRemoveNotice = vi.fn();

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	return {
		...( await importOriginal() ),
		useDispatch: vi.fn( () => ( {
			createNotice: mockCreateNotice,
			removeNotice: mockRemoveNotice,
		} ) ),
		useDispatchWithMap: vi.fn(),
		useSelect: vi.fn(),
	};
} );

vi.mock( import( '@wordpress/a11y' ), () => ( {
	speak: vi.fn(),
} ) );

function mockQueue( items, failureCount = 0, warnings = [] ) {
	const storeSelect = {
		getItems: () => items,
		isUploading: () => items.length > 0,
	};
	// `getFailureCount` and `getWarnings` are private selectors, so the
	// component reads them through `unlock`.
	lock( storeSelect, {
		getFailureCount: () => failureCount,
		getWarnings: () => warnings,
	} );
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
		vi.clearAllMocks();
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
		vi.useFakeTimers();
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
				vi.runAllTimers();
			} );

			expect( mockRemoveNotice ).toHaveBeenCalledWith(
				'upload-progress'
			);
		} finally {
			vi.useRealTimers();
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

	it( 'names the file when one upload is missing files', () => {
		const first = { id: 'a', code: 'GENERAL', message: 'First warning' };

		mockQueue( [] );
		const { rerender } = render( <UploadProgressSnackbar /> );

		mockQueue( [], 0, [ first ] );
		rerender( <UploadProgressSnackbar /> );

		expect( mockCreateNotice ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'warning',
			'First warning',
			{
				id: 'upload-warning',
				type: 'snackbar',
				explicitDismiss: true,
				onDismiss: expect.any( Function ),
			}
		);
	} );

	it( 'counts the uploads in one snackbar when several are missing files', () => {
		const first = { id: 'a', code: 'GENERAL', message: 'First warning' };
		const second = {
			id: 'b',
			code: 'STORAGE_LIMIT_REACHED',
			message: 'Second warning',
		};

		mockQueue( [] );
		const { rerender } = render( <UploadProgressSnackbar /> );

		mockQueue( [], 0, [ first ] );
		rerender( <UploadProgressSnackbar /> );
		mockQueue( [], 0, [ first, second ] );
		rerender( <UploadProgressSnackbar /> );

		expect( mockCreateNotice ).toHaveBeenCalledTimes( 2 );
		expect( mockCreateNotice ).toHaveBeenLastCalledWith(
			'warning',
			'2 images were uploaded, but some of the image sizes could not be saved.',
			expect.objectContaining( { id: 'upload-warning' } )
		);
	} );

	it( 'blames storage space when it caused every missing file', () => {
		const warnings = [ 'a', 'b', 'c' ].map( ( id ) => ( {
			id,
			code: 'STORAGE_LIMIT_REACHED',
			message: `Warning ${ id }`,
		} ) );

		mockQueue( [] );
		const { rerender } = render( <UploadProgressSnackbar /> );

		mockQueue( [], 0, warnings );
		rerender( <UploadProgressSnackbar /> );

		expect( mockCreateNotice ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'warning',
			'3 images were uploaded, but some of the image sizes could not be saved because this site is out of storage space.',
			expect.objectContaining( { id: 'upload-warning' } )
		);
	} );

	it( 'starts the count again once the warning is dismissed', () => {
		const warnings = [ 'a', 'b', 'c' ].map( ( id ) => ( {
			id,
			code: 'GENERAL',
			message: `Warning ${ id }`,
		} ) );

		mockQueue( [] );
		const { rerender } = render( <UploadProgressSnackbar /> );

		mockQueue( [], 0, warnings.slice( 0, 2 ) );
		rerender( <UploadProgressSnackbar /> );

		// The user dismisses the snackbar that reported two images.
		mockCreateNotice.mock.lastCall[ 2 ].onDismiss();

		mockQueue( [], 0, warnings );
		rerender( <UploadProgressSnackbar /> );

		expect( mockCreateNotice ).toHaveBeenCalledTimes( 2 );
		expect( mockCreateNotice ).toHaveBeenLastCalledWith(
			'warning',
			'Warning c',
			expect.objectContaining( { id: 'upload-warning' } )
		);
	} );

	it( 'counts an upload once when it has several warnings', () => {
		const warnings = [ 'a', 'a', 'b' ].map( ( id, index ) => ( {
			id,
			code: 'GENERAL',
			message: `Warning ${ index }`,
		} ) );

		mockQueue( [] );
		const { rerender } = render( <UploadProgressSnackbar /> );

		mockQueue( [], 0, warnings );
		rerender( <UploadProgressSnackbar /> );

		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'warning',
			'2 images were uploaded, but some of the image sizes could not be saved.',
			expect.objectContaining( { id: 'upload-warning' } )
		);
	} );

	it( 'does not repeat earlier warnings when it mounts again', () => {
		const first = { id: 'a', code: 'GENERAL', message: 'First warning' };
		const second = { id: 'b', code: 'GENERAL', message: 'Second warning' };

		mockQueue( [], 0, [ first ] );
		const { rerender } = render( <UploadProgressSnackbar /> );

		expect( mockCreateNotice ).not.toHaveBeenCalled();

		mockQueue( [], 0, [ first, second ] );
		rerender( <UploadProgressSnackbar /> );

		expect( mockCreateNotice ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'warning',
			'Second warning',
			expect.objectContaining( { id: 'upload-warning' } )
		);
	} );

	it( 'removes the progress notice when it unmounts during an upload', () => {
		mockQueue( [ makeItem( '1', 'photo.jpg' ) ] );
		const { unmount } = render( <UploadProgressSnackbar /> );
		expect( mockRemoveNotice ).not.toHaveBeenCalled();

		unmount();

		expect( mockRemoveNotice ).toHaveBeenCalledWith( 'upload-progress' );
	} );

	it( 'removes the warning notice when it unmounts', () => {
		const first = { id: 'a', code: 'GENERAL', message: 'First warning' };

		mockQueue( [] );
		const { rerender, unmount } = render( <UploadProgressSnackbar /> );

		mockQueue( [], 0, [ first ] );
		rerender( <UploadProgressSnackbar /> );
		expect( mockRemoveNotice ).not.toHaveBeenCalled();

		unmount();

		expect( mockRemoveNotice ).toHaveBeenCalledWith( 'upload-warning' );
	} );
} );
