import { beforeEach, describe, expect, it, vi } from 'vitest';
import { select, dispatch } from '@wordpress/data';
import MediaUpload from '../index';
import type { MediaFrame, MediaFrameOptions, MediaUploadProps } from '../types';
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

	describe( 'buildAndSetGalleryFrame', () => {
		it( 'leaves image editing to the MediaFrame.Post handler', () => {
			const coreEditImageContent = vi.fn();
			const attachments = {
				models: [],
				props: { toJSON: () => ( {} ) },
			};

			class MediaFramePost {
				options: MediaFrameOptions;
				states = { add: vi.fn() };
				on = vi.fn< MediaFrame[ 'on' ] >();

				constructor( options: MediaFrameOptions ) {
					this.options = options;
					this.on(
						'content:render:edit-image',
						coreEditImageContent,
						this
					);
				}

				static extend( methods: {
					createStates: ( this: MediaFramePost ) => void;
				} ) {
					return class extends this {
						constructor( options: MediaFrameOptions ) {
							super( options );
							Object.assign( this, methods );
							methods.createStates.call( this );
						}
					};
				}
			}

			const Controller = vi.fn();
			vi.stubGlobal( 'wp', {
				media: {
					view: {
						MediaFrame: { Post: MediaFramePost },
						l10n: { createGalleryTitle: 'Create Gallery' },
					},
					controller: {
						Library: Controller,
						EditImage: Controller,
						GalleryEdit: Controller,
						GalleryAdd: Controller,
					},
					query: vi.fn( () => attachments ),
					model: { Selection: Controller },
				},
			} );

			try {
				for ( const value of [ [ 15 ], [] ] ) {
					const instance = new MediaUpload( { ...props, value } );
					instance.buildAndSetGalleryFrame();

					expect( instance.frame.options.state ).toBe(
						value.length ? 'gallery-edit' : 'gallery'
					);
					expect(
						vi
							.mocked( instance.frame.on )
							.mock.calls.filter(
								( [ event ] ) =>
									event === 'content:render:edit-image'
							)
					).toEqual( [
						[
							'content:render:edit-image',
							coreEditImageContent,
							instance.frame,
						],
					] );
				}
			} finally {
				vi.unstubAllGlobals();
			}
		} );
	} );
} );
