/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import UploadingOverlay, { getOperationLabel } from '../uploading-overlay';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn( () => ( { cancelItem: jest.fn() } ) ),
} ) );

// Mock @wordpress/components because importing the real package pulls in
// a deep dependency chain (@wordpress/rich-text store registration, etc.)
// that fails in this isolated test environment. These minimal implementations
// preserve the correct ARIA roles for accessibility testing.
jest.mock( '@wordpress/components', () => {
	const actual = jest.requireActual( '@wordpress/element' );
	return {
		ProgressBar: ( { value, ...props } ) =>
			actual.createElement( 'div', {
				role: 'progressbar',
				'aria-valuenow': value,
				...props,
			} ),
		Button: ( { children, __next40pxDefaultSize, variant, ...props } ) =>
			actual.createElement( 'button', props, children ),
	};
} );

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
			getItemByAttachmentId: () => undefined,
			getChildItemCount: () => 0,
			...overrides,
		} ) )
	);
}

describe( 'getOperationLabel', () => {
	it.each( [
		[ 'PREPARE', 'Preparing…' ],
		[ 'UPLOAD', 'Uploading…' ],
		[ 'RESIZE_CROP', 'Resizing…' ],
		[ 'ROTATE', 'Rotating…' ],
		[ 'TRANSCODE_IMAGE', 'Compressing…' ],
		[ 'THUMBNAIL_GENERATION', 'Generating thumbnails…' ],
		[ 'FINALIZE', 'Finalizing…' ],
	] )(
		'should return correct label for %s operation',
		( operation, expected ) => {
			expect( getOperationLabel( operation ) ).toBe( expected );
		}
	);

	it( 'should return Processing… for undefined operation', () => {
		expect( getOperationLabel( undefined ) ).toBe( 'Processing…' );
	} );

	it( 'should return Processing… for unknown operation', () => {
		expect( getOperationLabel( 'UNKNOWN_OP' ) ).toBe( 'Processing…' );
	} );
} );

describe( 'UploadingOverlay', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render a progress bar', () => {
		mockUseSelect();
		render( <UploadingOverlay url="blob:123" onCancel={ jest.fn() } /> );
		expect(
			screen.getByRole( 'progressbar', { name: 'Upload progress' } )
		).toBeInTheDocument();
	} );

	it( 'should render a cancel button', () => {
		mockUseSelect();
		render( <UploadingOverlay url="blob:123" onCancel={ jest.fn() } /> );
		expect(
			screen.getByRole( 'button', { name: 'Cancel upload' } )
		).toBeInTheDocument();
	} );

	it( 'should display operation label from store', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				currentOperation: 'UPLOAD',
				progress: 50,
			} ),
		} );
		render( <UploadingOverlay url="blob:123" onCancel={ jest.fn() } /> );
		expect( screen.getByText( /Uploading…/ ) ).toBeInTheDocument();
	} );

	it( 'should display progress percentage', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				currentOperation: 'UPLOAD',
				progress: 75,
			} ),
		} );
		render( <UploadingOverlay url="blob:123" onCancel={ jest.fn() } /> );
		expect( screen.getByText( /75%/ ) ).toBeInTheDocument();
	} );

	it( 'should display default label when no item is found', () => {
		mockUseSelect();
		render( <UploadingOverlay url="blob:123" onCancel={ jest.fn() } /> );
		expect( screen.getByText( /Processing…/ ) ).toBeInTheDocument();
	} );

	it( 'should display batch label when batchSize > 1', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				currentOperation: 'UPLOAD',
				progress: 30,
				batchSize: 5,
				batchIndex: 3,
			} ),
		} );
		render( <UploadingOverlay url="blob:123" onCancel={ jest.fn() } /> );
		expect( screen.getByText( /Image 3 of 5/ ) ).toBeInTheDocument();
	} );

	it( 'should display thumbnail progress when generating thumbnails', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				id: 'item-1',
				currentOperation: 'THUMBNAIL_GENERATION',
				progress: 60,
				thumbnailCount: 4,
			} ),
			getChildItemCount: () => 2,
		} );
		render( <UploadingOverlay url="blob:123" onCancel={ jest.fn() } /> );
		expect(
			screen.getByText( /Generating subsize 3 of 4/ )
		).toBeInTheDocument();
	} );

	it( 'should fall back to attachmentId lookup when url finds no item', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => undefined,
			getItemByAttachmentId: () => ( {
				currentOperation: 'FINALIZE',
				progress: 90,
			} ),
		} );
		render(
			<UploadingOverlay
				url={ undefined }
				attachmentId={ 42 }
				onCancel={ jest.fn() }
			/>
		);
		expect( screen.getByText( /Finalizing…/ ) ).toBeInTheDocument();
		expect( screen.getByText( /90%/ ) ).toBeInTheDocument();
	} );

	it( 'should call cancelItem and onCancel when cancel is clicked', async () => {
		const user = userEvent.setup();
		const mockCancelItem = jest.fn();
		const mockOnCancel = jest.fn();

		useDispatch.mockReturnValue( { cancelItem: mockCancelItem } );
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				id: 'item-1',
				currentOperation: 'UPLOAD',
				progress: 50,
			} ),
		} );

		render( <UploadingOverlay url="blob:123" onCancel={ mockOnCancel } /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Cancel upload' } )
		);
		expect( mockCancelItem ).toHaveBeenCalledWith(
			'item-1',
			expect.any( Error )
		);
		expect( mockOnCancel ).toHaveBeenCalled();
	} );

	it( 'should still call onCancel when no itemId is available', async () => {
		const user = userEvent.setup();
		const mockCancelItem = jest.fn();
		const mockOnCancel = jest.fn();

		useDispatch.mockReturnValue( { cancelItem: mockCancelItem } );
		mockUseSelect();

		render( <UploadingOverlay url="blob:123" onCancel={ mockOnCancel } /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Cancel upload' } )
		);
		expect( mockCancelItem ).not.toHaveBeenCalled();
		expect( mockOnCancel ).toHaveBeenCalled();
	} );

	it( 'should not display percentage when progress is undefined', () => {
		mockUseSelect( {
			getItemByBlobUrl: () => ( {
				currentOperation: 'PREPARE',
				progress: undefined,
			} ),
		} );
		render( <UploadingOverlay url="blob:123" onCancel={ jest.fn() } /> );
		expect( screen.getByText( 'Preparing…' ) ).toBeInTheDocument();
		expect( screen.queryByText( /%/ ) ).not.toBeInTheDocument();
	} );
} );
