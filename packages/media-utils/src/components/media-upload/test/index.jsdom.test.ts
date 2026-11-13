import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { select, dispatch } from '@wordpress/data';
import { renderToString } from '@wordpress/element';
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
	afterEach( () => vi.unstubAllGlobals() );

	it( 'renders its opening control without a browser window', () => {
		vi.stubGlobal( 'window', undefined );
		const instance = new MediaUpload( {
			...props,
			render: () => 'Open media',
		} );
		expect( renderToString( instance.render() ) ).toBe( 'Open media' );
	} );

	it( 'opens the Core frame when WordPress supplies older Components', () => {
		vi.stubGlobal( 'wp', { components: { Modal: {}, Popover: {} } } );
		const frame = {
			open: vi.fn(),
			on: vi.fn(),
		} as unknown as MediaFrame;
		const instance = new MediaUpload( props );
		vi.spyOn( instance, 'buildAndSetSingleMediaFrame' ).mockImplementation(
			() => {
				instance.frame = frame;
			}
		);
		instance.openModal();
		expect( frame.open ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'opens a custom subclass with its legacy Core frame', () => {
		const coreOpen = vi.fn();
		const frame = {
			open: coreOpen,
			on: vi.fn(),
		} as unknown as MediaFrame;
		class CustomMediaUpload extends MediaUpload {
			buildAndSetSingleMediaFrame() {
				this.frame = frame;
			}
		}
		const instance = new CustomMediaUpload( props );
		instance.openModal();
		expect( coreOpen ).toHaveBeenCalledTimes( 1 );
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
