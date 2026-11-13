import { beforeEach, describe, expect, it, vi } from 'vitest';
import { select, dispatch } from '@wordpress/data';
import MediaUpload from '../index';
import type { MediaUploadProps } from '../types';
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
			instance.onClose();

			expect( invalidateAttachmentResolutions ).toHaveBeenCalledTimes(
				1
			);
			expect( invalidateAttachmentResolutions ).toHaveBeenCalledWith( {
				select,
				dispatch,
			} );
		} );

		it( 'invalidates even when no onClose prop is provided', () => {
			const instance = new MediaUpload( props );

			instance.onClose();

			expect( invalidateAttachmentResolutions ).toHaveBeenCalledTimes(
				1
			);
			expect( invalidateAttachmentResolutions ).toHaveBeenCalledWith( {
				select,
				dispatch,
			} );
		} );

		it( 'calls the onClose prop', () => {
			const onClose = vi.fn();
			const instance = new MediaUpload( { ...props, onClose } );

			instance.onClose();

			expect( onClose ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
