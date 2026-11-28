import { beforeEach, describe, expect, it, vi } from 'vitest';
import { select, dispatch } from '@wordpress/data';
import MediaUpload from '../index';
import type { MediaFrame, MediaUploadProps } from '../types';
import { invalidateAttachmentResolutions } from '../../../utils/invalidate-attachment-resolutions';

vi.mock( import( '../../../utils/invalidate-attachment-resolutions' ) );

describe( 'MediaUpload', () => {
	const props: MediaUploadProps = {
		onSelect: vi.fn(),
		render: vi.fn(),
	};

	beforeEach( () => {
		vi.clearAllMocks();
	} );

	describe( 'onClose', () => {
		it( 'invalidates the cached attachment resolutions against the default registry', () => {
			const instance = new MediaUpload( { ...props, onClose: vi.fn() } );
			// `onClose` detaches the underlying wp.media frame; stub it so the
			// method can run without the global media library being present.
			instance.frame = { detach: vi.fn() } as unknown as MediaFrame;

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
			const instance = new MediaUpload( props );
			instance.frame = { detach: vi.fn() } as unknown as MediaFrame;

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
			const onClose = vi.fn();
			const instance = new MediaUpload( { ...props, onClose } );
			instance.frame = { detach: vi.fn() } as unknown as MediaFrame;

			instance.onClose();

			expect( onClose ).toHaveBeenCalledTimes( 1 );
			expect( instance.frame.detach ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'componentWillUnmount', () => {
		const createFrame = () =>
			( {
				close: vi.fn(),
				detach: vi.fn(),
				remove: vi.fn(),
				modal: { remove: vi.fn() },
			} ) as unknown as MediaFrame;

		it( 'removes the frame when the modal is closed', () => {
			const instance = new MediaUpload( props );
			const frame = createFrame();
			instance.frame = frame;

			instance.componentWillUnmount();

			expect( frame.close ).toHaveBeenCalledTimes( 1 );
			expect( frame.modal!.remove ).toHaveBeenCalledTimes( 1 );
			expect( frame.remove ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'keeps an open modal until it closes, then removes the frame', () => {
			const instance = new MediaUpload( props );
			const frame = createFrame();
			instance.frame = frame;
			instance.isFrameOpen = true;

			instance.componentWillUnmount();

			expect( frame.close ).not.toHaveBeenCalled();
			expect( frame.remove ).not.toHaveBeenCalled();

			instance.onClose();

			expect( frame.modal!.remove ).toHaveBeenCalledTimes( 1 );
			expect( frame.remove ).toHaveBeenCalledTimes( 1 );
			expect( frame.detach ).not.toHaveBeenCalled();
		} );
	} );
} );
