/**
 * Internal dependencies
 */
import mediaUpload from '../media-upload';
import {
	getState,
	reset,
} from '../../components/upload-progress-snackbar/tracker';

jest.mock( '@wordpress/media-utils', () => ( {
	uploadMedia: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: { name: 'core' },
} ) );

jest.mock( '../../store', () => ( {
	store: { name: 'core/editor' },
} ) );

const mockLockPostSaving = jest.fn();
const mockLockPostAutosaving = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	select: jest.fn( () => ( {
		getCurrentPost: () => ( { id: 1 } ),
		getEditorSettings: () => ( {
			allowedMimeTypes: null,
			maxUploadFileSize: 10 * 1024 * 1024,
		} ),
	} ) ),
	dispatch: jest.fn( () => ( {
		receiveEntityRecords: jest.fn(),
		lockPostSaving: mockLockPostSaving,
		unlockPostSaving: jest.fn(),
		lockPostAutosaving: mockLockPostAutosaving,
		unlockPostAutosaving: jest.fn(),
	} ) ),
} ) );

describe( 'mediaUpload', () => {
	beforeEach( () => {
		reset();
		jest.clearAllMocks();
	} );

	it( 'registers files with the upload progress tracker and locks saving', () => {
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		mediaUpload( { filesList: [ file ] } );

		expect( getState() ).toEqual( {
			total: 1,
			completed: 0,
			pending: [ 'photo.jpg' ],
		} );
		expect( mockLockPostSaving ).toHaveBeenCalled();
		expect( mockLockPostAutosaving ).toHaveBeenCalled();
	} );

	it( 'skips tracking and save locking for transport-only calls', () => {
		// The upload-media queue calls this wrapper as its server transport;
		// it already counts its own queue items for the progress snackbar
		// (registering the same file here would double-count it, see
		// gutenberg#80369) and locks saving via useUploadSaveLock.
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		mediaUpload( { filesList: [ file ], isTransportOnly: true } );

		expect( getState() ).toBeNull();
		expect( mockLockPostSaving ).not.toHaveBeenCalled();
		expect( mockLockPostAutosaving ).not.toHaveBeenCalled();
	} );
} );
