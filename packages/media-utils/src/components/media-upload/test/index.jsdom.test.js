import { beforeEach, describe, expect, it, vi } from 'vitest';
import { select, dispatch } from '@wordpress/data';
import MediaUpload from '../index';
import { invalidateAttachmentResolutions } from '../../../utils/invalidate-attachment-resolutions';

vi.mock( import( '../../../utils/invalidate-attachment-resolutions' ) );

describe( 'MediaUpload', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	describe( 'onClose', () => {
		it( 'invalidates the cached attachment resolutions against the default registry', () => {
			const instance = new MediaUpload( { onClose: vi.fn() } );
			// `onClose` detaches the underlying wp.media frame; stub it so the
			// method can run without the global media library being present.
			instance.frame = { detach: vi.fn() };

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
			instance.frame = { detach: vi.fn() };

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
			const instance = new MediaUpload( { onClose } );
			instance.frame = { detach: vi.fn() };

			instance.onClose();

			expect( onClose ).toHaveBeenCalledTimes( 1 );
			expect( instance.frame.detach ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'buildAndSetGalleryFrame', () => {
		it( 'leaves image editing to the MediaFrame.Post handler', () => {
			const originalWp = window.wp;
			const coreEditImageContent = vi.fn();
			const attachments = {
				models: [],
				props: { toJSON: () => ( {} ) },
			};

			class MediaFramePost {
				constructor( options ) {
					this.options = options;
					this.handlers = [];
					this.states = { add: vi.fn() };
					this.on = ( event, callback, context ) => {
						this.handlers.push( { event, callback, context } );
					};
					this.on(
						'content:render:edit-image',
						coreEditImageContent,
						this
					);
				}

				static extend( methods ) {
					return class extends this {
						constructor( options ) {
							super( options );
							Object.assign( this, methods );
							this.createStates();
						}
					};
				}
			}

			const Controller = vi.fn();
			window.wp = {
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
			};

			try {
				for ( const value of [ [ 15 ], [] ] ) {
					const instance = new MediaUpload( { value } );
					instance.buildAndSetGalleryFrame();

					expect( instance.frame.options.state ).toBe(
						value.length ? 'gallery-edit' : 'gallery'
					);
					expect(
						instance.frame.handlers.filter(
							( { event } ) =>
								event === 'content:render:edit-image'
						)
					).toEqual( [
						{
							event: 'content:render:edit-image',
							callback: coreEditImageContent,
							context: instance.frame,
						},
					] );
				}
			} finally {
				window.wp = originalWp;
			}
		} );
	} );
} );
