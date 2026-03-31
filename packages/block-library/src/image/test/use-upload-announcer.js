/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import useUploadAnnouncer from '../use-upload-announcer';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/a11y', () => ( {
	speak: jest.fn(),
} ) );

jest.mock( '@wordpress/upload-media', () => ( {
	store: 'upload-media',
} ) );

jest.mock( '../../lock-unlock', () => ( {
	unlock: jest.fn( ( fn ) => fn ),
} ) );

function mockUseSelect( overrides = {} ) {
	useSelect.mockImplementation( ( callback ) =>
		callback( () => ( {
			getItemByBlobUrl: () => undefined,
			isBatchUploaded: () => false,
			...overrides,
		} ) )
	);
}

describe( 'useUploadAnnouncer', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should not announce when url is falsy', () => {
		mockUseSelect();
		renderHook( () => useUploadAnnouncer( null, false ) );
		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'should announce single upload start with filename', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: 1,
				batchIndex: 1,
			} ),
		} );
		renderHook( () =>
			useUploadAnnouncer( 'blob:123', false, 'photo.jpg' )
		);
		expect( speak ).toHaveBeenCalledWith(
			'Uploading photo.jpg…',
			'polite'
		);
	} );

	it( 'should announce single upload start without filename', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: 1,
				batchIndex: 1,
			} ),
		} );
		renderHook( () => useUploadAnnouncer( 'blob:123', false ) );
		expect( speak ).toHaveBeenCalledWith( 'Uploading image…', 'polite' );
	} );

	it( 'should announce batch upload start from lead item', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: 3,
				batchIndex: 1,
			} ),
		} );
		renderHook( () => useUploadAnnouncer( 'blob:123', false ) );
		expect( speak ).toHaveBeenCalledWith( 'Uploading 3 images…', 'polite' );
	} );

	it( 'should not announce batch upload start from non-lead item', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: 3,
				batchIndex: 2,
			} ),
		} );
		renderHook( () => useUploadAnnouncer( 'blob:123', false ) );
		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'should not announce start when batch metadata is not yet available', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: undefined,
				batchIndex: undefined,
			} ),
		} );
		renderHook( () => useUploadAnnouncer( 'blob:123', false ) );
		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'should announce single upload completion with filename', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: 1,
				batchIndex: 1,
			} ),
		} );

		const { rerender } = renderHook(
			( { isComplete } ) =>
				useUploadAnnouncer( 'blob:123', isComplete, 'photo.jpg' ),
			{ initialProps: { isComplete: false } }
		);

		speak.mockClear();
		rerender( { isComplete: true } );

		expect( speak ).toHaveBeenCalledWith(
			'photo.jpg uploaded successfully.',
			'polite'
		);
	} );

	it( 'should announce single upload completion without filename', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: 1,
				batchIndex: 1,
			} ),
		} );

		const { rerender } = renderHook(
			( { isComplete } ) => useUploadAnnouncer( 'blob:123', isComplete ),
			{ initialProps: { isComplete: false } }
		);

		speak.mockClear();
		rerender( { isComplete: true } );

		expect( speak ).toHaveBeenCalledWith(
			'Image uploaded successfully.',
			'polite'
		);
	} );

	it( 'should announce batch completion from lead item when batch is complete', () => {
		const getItemByBlobUrl = () => ( {
			batchSize: 3,
			batchIndex: 1,
			batchId: 'batch-1',
		} );

		// Start with batch not complete.
		mockUseSelect( {
			getItemByBlobUrl,
			isBatchUploaded: () => false,
		} );

		const { rerender } = renderHook(
			( { isComplete } ) => useUploadAnnouncer( 'blob:123', isComplete ),
			{ initialProps: { isComplete: false } }
		);

		speak.mockClear();

		// Batch completes.
		mockUseSelect( {
			getItemByBlobUrl,
			isBatchUploaded: () => true,
		} );
		rerender( { isComplete: true } );

		expect( speak ).toHaveBeenCalledWith(
			'3 images uploaded successfully.',
			'polite'
		);
	} );

	it( 'should not announce batch completion from non-lead item', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: 3,
				batchIndex: 2,
				batchId: 'batch-1',
			} ),
			isBatchUploaded: () => true,
		} );

		const { rerender } = renderHook(
			( { isComplete } ) => useUploadAnnouncer( 'blob:123', isComplete ),
			{ initialProps: { isComplete: false } }
		);

		speak.mockClear();
		rerender( { isComplete: true } );

		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'should announce error assertively', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: 1,
				batchIndex: 1,
				error: { message: 'File too large' },
			} ),
		} );
		renderHook( () => useUploadAnnouncer( 'blob:123', false ) );
		expect( speak ).toHaveBeenCalledWith(
			'Upload failed: File too large',
			'assertive'
		);
	} );

	it( 'should announce generic error when message is missing', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: 1,
				batchIndex: 1,
				error: {},
			} ),
		} );
		renderHook( () => useUploadAnnouncer( 'blob:123', false ) );
		expect( speak ).toHaveBeenCalledWith( 'Upload failed.', 'assertive' );
	} );

	it( 'should not re-announce the same error', () => {
		const error = { message: 'Network error' };
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: 1,
				batchIndex: 1,
				error,
			} ),
		} );

		const { rerender } = renderHook( () =>
			useUploadAnnouncer( 'blob:123', false )
		);

		const errorCallCount = speak.mock.calls.filter(
			( [ , priority ] ) => priority === 'assertive'
		).length;

		rerender();

		const newErrorCallCount = speak.mock.calls.filter(
			( [ , priority ] ) => priority === 'assertive'
		).length;

		expect( newErrorCallCount ).toBe( errorCallCount );
	} );

	it( 'should not re-announce start on rerender with same URL', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				batchSize: 1,
				batchIndex: 1,
			} ),
		} );

		const { rerender } = renderHook( () =>
			useUploadAnnouncer( 'blob:123', false, 'photo.jpg' )
		);

		expect( speak ).toHaveBeenCalledTimes( 1 );
		speak.mockClear();

		rerender();
		expect( speak ).not.toHaveBeenCalled();
	} );
} );
