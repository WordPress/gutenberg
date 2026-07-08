/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import MediaUpload from '../index';
import { invalidateAttachmentResolutions } from '../../../utils/invalidate-attachment-resolutions';

jest.mock( '../../../utils/invalidate-attachment-resolutions' );

describe( 'MediaUpload', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'onClose', () => {
		it( 'invalidates the cached attachment resolutions against the default registry', () => {
			const instance = new MediaUpload( { onClose: jest.fn() } );
			// `onClose` detaches the underlying wp.media frame; stub it so the
			// method can run without the global media library being present.
			instance.frame = { detach: jest.fn() };

			instance.onClose();

			expect( invalidateAttachmentResolutions ).toHaveBeenCalledTimes(
				1
			);
			expect( invalidateAttachmentResolutions ).toHaveBeenCalledWith( {
				select,
				dispatch,
			} );
			// The frame is still detached after invalidating.
			expect( instance.frame.detach ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'invalidates even when no onClose prop is provided', () => {
			const instance = new MediaUpload( {} );
			instance.frame = { detach: jest.fn() };

			instance.onClose();

			expect( invalidateAttachmentResolutions ).toHaveBeenCalledTimes(
				1
			);
			expect( invalidateAttachmentResolutions ).toHaveBeenCalledWith( {
				select,
				dispatch,
			} );
		} );

		it( 'calls the onClose prop before detaching the frame', () => {
			const onClose = jest.fn();
			const instance = new MediaUpload( { onClose } );
			instance.frame = { detach: jest.fn() };

			instance.onClose();

			expect( onClose ).toHaveBeenCalledTimes( 1 );
			expect( instance.frame.detach ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
