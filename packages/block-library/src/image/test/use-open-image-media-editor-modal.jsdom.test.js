import { act, renderHook } from '@testing-library/react';
import { useRegistry, useSelect } from '@wordpress/data';
import {
	getImageBlockMetadataFromAttachment,
	getNewAttachmentImageBlockAttributes,
	getSyncedImageBlockAttributes,
	useOpenImageMediaEditorModal,
} from '../use-open-image-media-editor-modal';

const mockOpenMediaEditorModalKey = 'openMediaEditorModal';

jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

jest.mock( '@wordpress/data', () => ( {
	useRegistry: jest.fn(),
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	privateApis: {},
	store: {},
} ) );

jest.mock( '../../lock-unlock', () => ( {
	unlock: jest.fn( () => ( {
		openMediaEditorModalKey: 'openMediaEditorModal',
	} ) ),
} ) );

function createRegistry( {
	getEditedEntityRecord = () => false,
	resolveGetEntityRecord = () => undefined,
} = {} ) {
	const actions = {
		invalidateResolution: jest.fn(),
	};
	return {
		select: jest.fn( () => ( {
			getEditedEntityRecord,
		} ) ),
		dispatch: jest.fn( () => actions ),
		resolveSelect: jest.fn( () => ( {
			getEntityRecord: resolveGetEntityRecord,
		} ) ),
		actions,
	};
}

function createDeferred() {
	let resolve;
	const promise = new Promise( ( _resolve ) => {
		resolve = _resolve;
	} );
	return { promise, resolve };
}

function mockMediaEditorModalSetting( openMediaEditorModal ) {
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getSettings: () => ( {
				[ mockOpenMediaEditorModalKey ]: openMediaEditorModal,
			} ),
		} ) )
	);
}

async function runModalUpdate( {
	attributes,
	registryOptions = {},
	updatePayload = { id: attributes.id, url: 'updated.jpg' },
	hookOptions = {},
} ) {
	const registry = createRegistry( registryOptions );
	useRegistry.mockReturnValue( registry );
	const setAttributes = jest.fn();
	const openMediaEditorModal = jest.fn();
	mockMediaEditorModalSetting( openMediaEditorModal );
	const { result } = renderHook( () =>
		useOpenImageMediaEditorModal( {
			attributes,
			setAttributes,
			...hookOptions,
		} )
	);
	await act( async () => {
		await result.current();
	} );
	await act( async () => {
		await openMediaEditorModal.mock.calls[ 0 ][ 0 ].onUpdate(
			updatePayload
		);
	} );
	return { setAttributes, registry, openMediaEditorModal };
}

// The attachment as it was before the edit. Its metadata matches the blocks
// used below, so the metadata sync never contributes attributes and the
// assertions stay about the ones derived from the edited attachment.
const ORIGINAL_ATTACHMENT = {
	id: 1,
	alt_text: '',
	caption: { raw: '' },
};

// Editing media saves to a new attachment, with its own sub-sizes, file and
// attachment page.
const CROPPED_ATTACHMENT = {
	id: 2,
	alt_text: '',
	caption: { raw: '' },
	source_url: 'cropped.jpg',
	link: 'https://example.com/cropped/',
	media_details: {
		sizes: {
			medium: { source_url: 'cropped-300x200.jpg' },
			full: { source_url: 'cropped.jpg' },
		},
	},
};

// What the media editor reports after a crop, rotate or flip: it saved to a
// new attachment, and reports that attachment's full-size file.
const CROP_UPDATE = {
	id: CROPPED_ATTACHMENT.id,
	url: CROPPED_ATTACHMENT.source_url,
};

/**
 * Registry options for an edit that saved to a new attachment: the pre-edit
 * record is cached, and the edited one is only reachable by resolving it.
 *
 * @param {Object}  options             Options.
 * @param {boolean} options.hasOriginal Whether the pre-edit attachment is
 *                                      known at all; without it there is no
 *                                      metadata baseline.
 */
function croppedAttachmentRecords( { hasOriginal = true } = {} ) {
	return {
		getEditedEntityRecord: ( kind, name, attachmentId ) =>
			hasOriginal && attachmentId === ORIGINAL_ATTACHMENT.id
				? ORIGINAL_ATTACHMENT
				: undefined,
		resolveGetEntityRecord: ( kind, name, attachmentId ) =>
			attachmentId === CROPPED_ATTACHMENT.id
				? CROPPED_ATTACHMENT
				: undefined,
	};
}

describe( 'useOpenImageMediaEditorModal', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'notifies onUrlChange when the update switches to a new attachment URL', async () => {
		const onUrlChange = jest.fn();
		await runModalUpdate( {
			attributes: { id: 1, url: 'original.jpg', alt: '', caption: '' },
			updatePayload: { id: 2, url: 'updated.jpg' },
			hookOptions: { onUrlChange },
		} );
		expect( onUrlChange ).toHaveBeenCalledTimes( 1 );
		expect( onUrlChange ).toHaveBeenCalledWith( 'updated.jpg' );
	} );

	it( 'does not notify onUrlChange for a same-attachment update', async () => {
		const onUrlChange = jest.fn();
		await runModalUpdate( {
			attributes: { id: 1, url: 'original.jpg', alt: '', caption: '' },
			updatePayload: { id: 1, url: 'original.jpg' },
			hookOptions: { onUrlChange },
		} );
		expect( onUrlChange ).not.toHaveBeenCalled();
	} );

	it( 'does not notify onUrlChange when the update carries no URL', async () => {
		const onUrlChange = jest.fn();
		await runModalUpdate( {
			attributes: { id: 1, url: 'original.jpg', alt: '', caption: '' },
			updatePayload: { id: 2 },
			hookOptions: { onUrlChange },
		} );
		expect( onUrlChange ).not.toHaveBeenCalled();
	} );

	it( 'returns no opener when the media editor modal setting is unavailable', () => {
		useRegistry.mockReturnValue( createRegistry() );
		mockMediaEditorModalSetting( undefined );

		const { result } = renderHook( () =>
			useOpenImageMediaEditorModal( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: '',
				},
				setAttributes: jest.fn(),
			} )
		);

		expect( result.current ).toBeUndefined();
	} );

	it( 'passes an onClose handler for returning focus when the media editor closes', async () => {
		const cropButton = document.createElement( 'button' );
		const otherButton = document.createElement( 'button' );
		document.body.append( cropButton, otherButton );
		const registry = createRegistry();
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		mockMediaEditorModalSetting( openMediaEditorModal );
		const onClose = () => cropButton.focus();
		const { result } = renderHook( () =>
			useOpenImageMediaEditorModal( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: '',
				},
				setAttributes,
				onClose,
			} )
		);

		try {
			await act( async () => {
				await result.current();
			} );
			otherButton.focus();
			expect( otherButton ).toHaveFocus();

			openMediaEditorModal.mock.calls[ 0 ][ 0 ].onClose();

			expect( cropButton ).toHaveFocus();
		} finally {
			cropButton.remove();
			otherButton.remove();
		}
	} );

	it( 'resolves fresh attachment metadata when the same attachment id has a stale cache', async () => {
		const originalAttachment = {
			id: 1,
			alt_text: 'Original alt',
			caption: { raw: 'Original caption' },
		};
		const updatedAttachment = {
			id: 1,
			alt_text: 'Updated alt',
			caption: { raw: 'Updated caption' },
		};
		const { setAttributes, registry } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: 'Original alt',
				caption: 'Original caption',
			},
			registryOptions: {
				getEditedEntityRecord: () => originalAttachment,
				resolveGetEntityRecord: () => updatedAttachment,
			},
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			alt: 'Updated alt',
			caption: 'Updated caption',
		} );
		// A single, query-less resolution is invalidated: the hook reads,
		// resolves, and invalidates the attachment through the entity's default
		// (edit) context rather than an explicitly-keyed query.
		expect( registry.actions.invalidateResolution ).toHaveBeenCalledTimes(
			1
		);
		expect( registry.actions.invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecord',
			[ 'postType', 'attachment', 1 ]
		);
	} );

	it( 'resolves original raw attachment metadata before opening the modal when it is not cached', async () => {
		const originalAttachment = {
			id: 1,
			alt_text: 'Original alt',
			caption: { raw: 'Original caption' },
		};
		const updatedAttachment = {
			id: 1,
			alt_text: 'Updated alt',
			caption: { raw: 'Updated caption' },
		};
		const resolveGetEntityRecord = jest
			.fn()
			.mockResolvedValueOnce( originalAttachment )
			.mockResolvedValueOnce( updatedAttachment );
		const { setAttributes, openMediaEditorModal } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: 'Original alt',
				caption: 'Original caption',
			},
			registryOptions: { resolveGetEntityRecord },
		} );

		expect( resolveGetEntityRecord ).toHaveBeenNthCalledWith(
			1,
			'postType',
			'attachment',
			1
		);
		expect( openMediaEditorModal ).toHaveBeenCalledWith( {
			id: 1,
			onUpdate: expect.any( Function ),
			onClose: undefined,
		} );
		expect( setAttributes ).toHaveBeenCalledWith( {
			alt: 'Updated alt',
			caption: 'Updated caption',
		} );
	} );

	it( 'resolves original raw attachment metadata before opening the modal when the block has no caption', async () => {
		const originalAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: 'Existing attachment caption' },
		};
		const updatedAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: 'Updated attachment caption' },
		};
		const resolveGetEntityRecord = jest
			.fn()
			.mockResolvedValueOnce( originalAttachment )
			.mockResolvedValueOnce( updatedAttachment );
		const { setAttributes, openMediaEditorModal } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: '',
				caption: undefined,
			},
			registryOptions: { resolveGetEntityRecord },
		} );

		expect( resolveGetEntityRecord ).toHaveBeenNthCalledWith(
			1,
			'postType',
			'attachment',
			1
		);
		expect( openMediaEditorModal ).toHaveBeenCalledWith( {
			id: 1,
			onUpdate: expect.any( Function ),
			onClose: undefined,
		} );
		expect( setAttributes ).toHaveBeenCalledWith( {
			caption: 'Updated attachment caption',
		} );
	} );

	it( 'resolves original raw attachment metadata before opening the modal when the cached record has only a rendered caption', async () => {
		const originalAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: 'Existing attachment caption' },
		};
		const updatedAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: 'Updated attachment caption' },
		};
		const resolveGetEntityRecord = jest
			.fn()
			.mockResolvedValueOnce( originalAttachment )
			.mockResolvedValueOnce( updatedAttachment );
		const { setAttributes } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: '',
				caption: undefined,
			},
			registryOptions: {
				getEditedEntityRecord: () => ( {
					id: 1,
					alt_text: '',
					caption: {
						rendered: '<p>Existing attachment caption</p>\n',
					},
				} ),
				resolveGetEntityRecord,
			},
		} );

		expect( resolveGetEntityRecord ).toHaveBeenNthCalledWith(
			1,
			'postType',
			'attachment',
			1
		);
		expect( setAttributes ).toHaveBeenCalledWith( {
			caption: 'Updated attachment caption',
		} );
	} );

	it( 'resolves attachment metadata when a new attachment id is not cached', async () => {
		const originalAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: '' },
		};
		const updatedAttachment = {
			id: 2,
			alt_text: 'Updated alt',
			caption: { raw: 'Updated caption' },
		};
		const { setAttributes } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: '',
				caption: '',
			},
			registryOptions: {
				getEditedEntityRecord: ( kind, name, attachmentId ) =>
					attachmentId === 1 ? originalAttachment : undefined,
				resolveGetEntityRecord: ( kind, name, attachmentId ) =>
					attachmentId === 2 ? updatedAttachment : undefined,
			},
			updatePayload: { id: 2, url: 'cropped.jpg' },
		} );

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( {
			id: 2,
			url: 'cropped.jpg',
			alt: 'Updated alt',
			caption: 'Updated caption',
		} );
	} );

	it( 'keeps the selected image size when the edit created a new attachment', async () => {
		const onUrlChange = jest.fn();
		const { setAttributes } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original-300x200.jpg',
				alt: '',
				caption: '',
				sizeSlug: 'medium',
			},
			registryOptions: croppedAttachmentRecords(),
			updatePayload: CROP_UPDATE,
			hookOptions: { onUrlChange },
		} );

		// Everything lands in one update, so the block never renders against
		// half-updated settings.
		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( {
			id: 2,
			url: 'cropped-300x200.jpg',
		} );
		// The loading state settles against the file the block will render,
		// not the full-size file the media editor reported.
		expect( onUrlChange ).toHaveBeenLastCalledWith( 'cropped-300x200.jpg' );
	} );

	it( 'falls back to the saved record when the refetch fails', async () => {
		const { setAttributes } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original-300x200.jpg',
				alt: '',
				caption: '',
				sizeSlug: 'medium',
				href: 'original.jpg',
				linkDestination: 'media',
			},
			registryOptions: {
				// The media editor put the saved record in the store, so it
				// is cached even though refetching it fails.
				getEditedEntityRecord: ( kind, name, attachmentId ) =>
					attachmentId === ORIGINAL_ATTACHMENT.id
						? ORIGINAL_ATTACHMENT
						: CROPPED_ATTACHMENT,
				resolveGetEntityRecord: ( kind, name, attachmentId ) => {
					if ( attachmentId === CROPPED_ATTACHMENT.id ) {
						throw new Error( 'Network error' );
					}
					return undefined;
				},
			},
			updatePayload: CROP_UPDATE,
		} );

		// The size and link still follow the edited image, rather than the
		// block half-updating to the new file at its old settings.
		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( {
			id: 2,
			url: 'cropped-300x200.jpg',
			href: 'cropped.jpg',
		} );
	} );

	it( 'derives the size of the edited image without a metadata baseline', async () => {
		const { setAttributes, registry } = await runModalUpdate( {
			// Custom metadata leaves the block with no fallback baseline, and
			// the original attachment is unknown, so no metadata is synced.
			attributes: {
				id: 1,
				url: 'original-300x200.jpg',
				alt: 'Custom alt',
				caption: 'Custom caption',
				sizeSlug: 'medium',
			},
			registryOptions: croppedAttachmentRecords( { hasOriginal: false } ),
			updatePayload: CROP_UPDATE,
		} );

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( {
			id: 2,
			url: 'cropped-300x200.jpg',
		} );
		// The size is derived from a freshly resolved record for the edited
		// attachment, not a stale cached one.
		expect( registry.actions.invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecord',
			[ 'postType', 'attachment', 2 ]
		);
	} );

	it( 'points a media file link at the edited image', async () => {
		const { setAttributes } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: '',
				caption: '',
				href: 'original.jpg',
				linkDestination: 'media',
			},
			registryOptions: croppedAttachmentRecords(),
			updatePayload: CROP_UPDATE,
		} );

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( {
			id: 2,
			url: 'cropped.jpg',
			href: 'cropped.jpg',
		} );
	} );

	it( 'updates back to the previous attachment from the original modal callback', async () => {
		const originalAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: '' },
		};
		const croppedAttachment = {
			id: 2,
			alt_text: '',
			caption: { raw: '' },
		};
		const deferredAttachment = createDeferred();
		const registry = createRegistry( {
			getEditedEntityRecord: ( kind, name, attachmentId ) =>
				attachmentId === 1 ? originalAttachment : undefined,
			resolveGetEntityRecord: ( kind, name, attachmentId ) =>
				attachmentId === 2 ? deferredAttachment.promise : undefined,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		mockMediaEditorModalSetting( openMediaEditorModal );
		const { result } = renderHook(
			( { attributes } ) =>
				useOpenImageMediaEditorModal( { attributes, setAttributes } ),
			{
				initialProps: {
					attributes: {
						id: 1,
						url: 'original.jpg',
						alt: '',
						caption: '',
					},
				},
			}
		);

		await act( async () => {
			await result.current();
		} );
		const onUpdate = openMediaEditorModal.mock.calls[ 0 ][ 0 ].onUpdate;
		let updatePromise;
		await act( async () => {
			updatePromise = onUpdate( { id: 2, url: 'cropped.jpg' } );
		} );
		await act( async () => {
			await onUpdate( { id: 1, url: 'original.jpg' } );
		} );
		await act( async () => {
			deferredAttachment.resolve( croppedAttachment );
			await updatePromise;
		} );

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( {
			id: 1,
			url: 'original.jpg',
		} );
	} );

	it( 'resolves fresh metadata when the new attachment id has an incomplete cached record', async () => {
		const originalAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: '' },
		};
		const updatedAttachment = {
			id: 2,
			alt_text: 'Updated alt',
			caption: { raw: 'Updated caption' },
		};
		const { setAttributes } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: '',
				caption: '',
			},
			registryOptions: {
				getEditedEntityRecord: ( kind, name, attachmentId ) =>
					attachmentId === 1
						? originalAttachment
						: {
								id: 2,
								alt_text: 'Updated alt',
								caption: { raw: '' },
						  },
				resolveGetEntityRecord: ( kind, name, attachmentId ) =>
					attachmentId === 2 ? updatedAttachment : undefined,
			},
			updatePayload: { id: 2, url: 'cropped.jpg' },
		} );

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( {
			id: 2,
			url: 'cropped.jpg',
			alt: 'Updated alt',
			caption: 'Updated caption',
		} );
	} );

	it( 'syncs new raw caption to a block with no caption when the original attachment has one', async () => {
		const { setAttributes } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: '',
				caption: undefined,
			},
			registryOptions: {
				getEditedEntityRecord: () => ( {
					id: 1,
					alt_text: '',
					caption: { raw: 'Existing caption' },
				} ),
				resolveGetEntityRecord: () => ( {
					id: 1,
					alt_text: '',
					caption: { raw: 'New caption' },
				} ),
			},
			updatePayload: { id: 1, url: 'original.jpg' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			caption: 'New caption',
		} );
	} );

	it( 'syncs metadata from an empty block when the original attachment is not cached', async () => {
		const resolveGetEntityRecord = jest
			.fn()
			.mockResolvedValueOnce( {
				id: 1,
				alt_text: '',
				caption: { raw: '' },
			} )
			.mockResolvedValueOnce( {
				id: 1,
				alt_text: 'Updated alt',
				caption: { raw: 'Updated caption' },
			} );
		const { setAttributes } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: '',
				caption: '',
			},
			registryOptions: { resolveGetEntityRecord },
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			alt: 'Updated alt',
			caption: 'Updated caption',
		} );
	} );

	it( 'does not sync a field that was not changed in the modal', async () => {
		const { setAttributes } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: 'Original alt',
				caption: undefined,
			},
			registryOptions: {
				getEditedEntityRecord: () => ( {
					id: 1,
					alt_text: 'Original alt',
					caption: { raw: 'Existing caption' },
				} ),
				resolveGetEntityRecord: () => ( {
					id: 1,
					alt_text: 'Updated alt',
					caption: { raw: 'Existing caption' },
				} ),
			},
			updatePayload: { id: 1, url: 'original.jpg' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			alt: 'Updated alt',
		} );
	} );

	it( 'does not sync caption when it has never been set on the block and only alt text was changed', async () => {
		const { setAttributes } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: 'Original alt',
				// Mimics the _RichTextData object set on a block whose
				// caption has never been explicitly edited by the user.
				caption: { toString: () => '' },
			},
			registryOptions: {
				getEditedEntityRecord: () => ( {
					id: 1,
					alt_text: 'Original alt',
					caption: { raw: 'Existing caption' },
				} ),
				resolveGetEntityRecord: () => ( {
					id: 1,
					alt_text: 'Updated alt',
					caption: { raw: 'Existing caption' },
				} ),
			},
			updatePayload: { id: 1, url: 'original.jpg' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			alt: 'Updated alt',
		} );
	} );

	it( 'does not overwrite custom captions when the original attachment is not cached', async () => {
		const { setAttributes } = await runModalUpdate( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: '',
				caption: 'Custom caption',
			},
			registryOptions: {
				resolveGetEntityRecord: () => ( {
					id: 1,
					alt_text: '',
					caption: { raw: 'Updated caption' },
				} ),
			},
		} );

		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'does not sync metadata changed locally while fresh attachment metadata is resolving', async () => {
		const updatedAttachment = {
			id: 1,
			alt_text: 'Attachment alt',
			caption: { raw: 'Attachment caption' },
		};
		const deferredAttachment = createDeferred();
		const registry = createRegistry( {
			getEditedEntityRecord: () => ( {
				id: 1,
				alt_text: '',
				caption: { raw: '' },
			} ),
			resolveGetEntityRecord: () => deferredAttachment.promise,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		mockMediaEditorModalSetting( openMediaEditorModal );
		const { result, rerender } = renderHook(
			( { attributes } ) =>
				useOpenImageMediaEditorModal( { attributes, setAttributes } ),
			{
				initialProps: {
					attributes: {
						id: 1,
						url: 'original.jpg',
						alt: '',
						caption: '',
					},
				},
			}
		);

		await act( async () => {
			await result.current();
		} );
		let updatePromise;
		await act( async () => {
			updatePromise = openMediaEditorModal.mock.calls[ 0 ][ 0 ].onUpdate(
				{
					id: 1,
					url: 'updated.jpg',
				}
			);
		} );
		rerender( {
			attributes: {
				id: 1,
				url: 'original.jpg',
				alt: 'Local alt',
				caption: 'Local caption',
			},
		} );
		await act( async () => {
			deferredAttachment.resolve( updatedAttachment );
			await updatePromise;
		} );

		expect( setAttributes ).not.toHaveBeenCalledWith( {
			alt: 'Attachment alt',
			caption: 'Attachment caption',
		} );
	} );
} );

describe( 'getImageBlockMetadataFromAttachment', () => {
	it( 'normalizes attachment metadata to image block attributes', () => {
		expect(
			getImageBlockMetadataFromAttachment( {
				alt_text: 'Alt text',
				caption: { raw: 'First line\nSecond line' },
			} )
		).toEqual( {
			alt: 'Alt text',
			caption: 'First line<br>Second line',
		} );
	} );

	it( 'does not use rendered captions when raw captions are unavailable', () => {
		expect(
			getImageBlockMetadataFromAttachment( {
				alt_text: 'Alt text',
				caption: { rendered: '<p>Rendered caption</p>\n' },
			} )
		).toEqual( {
			alt: 'Alt text',
			caption: undefined,
		} );
	} );

	it( 'preserves paragraph markup in raw captions', () => {
		expect(
			getImageBlockMetadataFromAttachment( {
				caption: { raw: '<p>Raw caption</p>' },
			} ).caption
		).toBe( '<p>Raw caption</p>' );
	} );

	it( 'does not fall back to rendered captions when raw captions are empty', () => {
		expect(
			getImageBlockMetadataFromAttachment( {
				caption: {
					raw: '',
					rendered: '<p>Rendered caption</p>\n',
				},
			} ).caption
		).toBe( '' );
	} );

	it( 'returns an unknown caption when only rendered empty caption markup is available', () => {
		expect(
			getImageBlockMetadataFromAttachment( {
				caption: {
					rendered: '<p class="attachment"><br></p>\n',
				},
			} ).caption
		).toBe( undefined );
	} );
} );

describe( 'getSyncedImageBlockAttributes', () => {
	it( 'syncs updated attachment metadata when block metadata was not customized', () => {
		expect(
			getSyncedImageBlockAttributes(
				{
					alt: 'Original alt',
					caption: 'Original caption',
				},
				{
					alt_text: 'Original alt',
					caption: { raw: 'Original caption' },
				},
				{
					alt_text: 'Updated alt',
					caption: { raw: 'Updated caption' },
				}
			)
		).toEqual( {
			alt: 'Updated alt',
			caption: 'Updated caption',
		} );
	} );

	it( 'does not overwrite custom block alt text', () => {
		expect(
			getSyncedImageBlockAttributes(
				{
					alt: 'Custom alt',
					caption: 'Original caption',
				},
				{
					alt_text: 'Original alt',
					caption: { raw: 'Original caption' },
				},
				{
					alt_text: 'Updated alt',
					caption: { raw: 'Updated caption' },
				}
			)
		).toEqual( {
			caption: 'Updated caption',
		} );
	} );

	it( 'does not overwrite custom block captions', () => {
		expect(
			getSyncedImageBlockAttributes(
				{
					alt: 'Original alt',
					caption: 'Custom caption',
				},
				{
					alt_text: 'Original alt',
					caption: { raw: 'Original caption' },
				},
				{
					alt_text: 'Updated alt',
					caption: { raw: 'Updated caption' },
				}
			)
		).toEqual( {
			alt: 'Updated alt',
		} );
	} );

	it( 'syncs newly added attachment metadata when original metadata was empty', () => {
		expect(
			getSyncedImageBlockAttributes(
				{},
				{
					alt_text: '',
					caption: { raw: '' },
				},
				{
					alt_text: 'Updated alt',
					caption: { raw: 'Updated\ncaption' },
				}
			)
		).toEqual( {
			alt: 'Updated alt',
			caption: 'Updated<br>caption',
		} );
	} );

	it( 'does not sync captions when the original raw attachment caption is unavailable', () => {
		expect(
			getSyncedImageBlockAttributes(
				{},
				{
					caption: {
						rendered: '<p>Original caption</p>\n',
					},
				},
				{
					caption: { raw: 'Updated caption' },
				}
			)
		).toEqual( {} );
	} );

	it( 'syncs caption to a block with no caption when the original attachment has one', () => {
		expect(
			getSyncedImageBlockAttributes(
				{
					alt: '',
					caption: '',
				},
				{
					alt_text: '',
					caption: { raw: 'Existing caption' },
				},
				{
					alt_text: '',
					caption: { raw: 'Updated caption' },
				}
			)
		).toEqual( {
			caption: 'Updated caption',
		} );
	} );

	it( 'does not sync caption when block has a custom value differing from the original', () => {
		expect(
			getSyncedImageBlockAttributes(
				{
					alt: '',
					caption: 'Custom caption',
				},
				{
					alt_text: '',
					caption: { raw: 'Original caption' },
				},
				{
					alt_text: '',
					caption: { raw: 'Updated caption' },
				}
			)
		).toEqual( {} );
	} );

	it( 'clears captions when the updated attachment caption is empty', () => {
		expect(
			getSyncedImageBlockAttributes(
				{
					caption: 'Original caption',
				},
				{
					caption: { raw: 'Original caption' },
				},
				{
					caption: { raw: '' },
				}
			)
		).toEqual( {
			caption: undefined,
		} );
	} );

	it( 'does not sync when the original attachment metadata is unknown', () => {
		expect(
			getSyncedImageBlockAttributes(
				{
					alt: '',
					caption: '',
				},
				undefined,
				{
					alt_text: 'Updated alt',
					caption: { raw: 'Updated caption' },
				}
			)
		).toEqual( {} );
	} );
} );

describe( 'getNewAttachmentImageBlockAttributes', () => {
	const croppedAttachment = {
		id: 2,
		source_url: 'cropped.jpg',
		link: 'https://example.com/cropped/',
		media_details: {
			sizes: {
				medium: { source_url: 'cropped-300x200.jpg' },
				full: { source_url: 'cropped.jpg' },
			},
		},
	};

	it( 'points the URL at the selected size on the new attachment', () => {
		expect(
			getNewAttachmentImageBlockAttributes(
				{ sizeSlug: 'medium' },
				croppedAttachment
			)
		).toEqual( { url: 'cropped-300x200.jpg' } );
	} );

	it( 'falls back to full when the new attachment lacks the selected size', () => {
		expect(
			getNewAttachmentImageBlockAttributes(
				{ sizeSlug: 'large' },
				croppedAttachment
			)
		).toEqual( { url: 'cropped.jpg', sizeSlug: 'full' } );
	} );

	it( 'falls back to full when the edited image is too small for any sub-size', () => {
		// Cropping below the smallest registered size leaves
		// `media_details.sizes` empty, so the block has to fall back to the
		// file itself and stop reporting a size it no longer has.
		expect(
			getNewAttachmentImageBlockAttributes(
				{ sizeSlug: 'medium' },
				{
					id: 2,
					source_url: 'cropped-103x45.jpg',
					media_details: { width: 103, height: 45, sizes: {} },
				}
			)
		).toEqual( {
			url: 'cropped-103x45.jpg',
			sizeSlug: 'full',
		} );
	} );

	it( 'makes no change when no full-size URL is available', () => {
		expect(
			getNewAttachmentImageBlockAttributes(
				{ sizeSlug: 'large' },
				{ id: 2, media_details: { sizes: { medium: {} } } }
			)
		).toEqual( {} );
	} );

	it( 'makes no change for the full size or an unset size', () => {
		expect(
			getNewAttachmentImageBlockAttributes(
				{ sizeSlug: 'full' },
				croppedAttachment
			)
		).toEqual( {} );
		expect(
			getNewAttachmentImageBlockAttributes( {}, croppedAttachment )
		).toEqual( {} );
	} );

	it( 'makes no change when the attachment sizes are unknown', () => {
		expect(
			getNewAttachmentImageBlockAttributes(
				{ sizeSlug: 'medium' },
				{ id: 2 }
			)
		).toEqual( {} );
	} );

	it( 'makes no change when the attachment record is unknown', () => {
		expect(
			getNewAttachmentImageBlockAttributes(
				{ sizeSlug: 'medium' },
				undefined
			)
		).toBeUndefined();
	} );

	it( 'points a media file link at the new attachment file', () => {
		expect(
			getNewAttachmentImageBlockAttributes(
				{ sizeSlug: 'medium', linkDestination: 'media' },
				croppedAttachment
			)
		).toEqual( {
			url: 'cropped-300x200.jpg',
			href: 'cropped.jpg',
		} );
	} );

	it( 'points an attachment page link at the new attachment page', () => {
		expect(
			getNewAttachmentImageBlockAttributes(
				{ linkDestination: 'attachment' },
				croppedAttachment
			)
		).toEqual( { href: 'https://example.com/cropped/' } );
	} );

	it( 'leaves custom and absent links alone', () => {
		expect(
			getNewAttachmentImageBlockAttributes(
				{ linkDestination: 'custom' },
				croppedAttachment
			)
		).toEqual( {} );
		expect(
			getNewAttachmentImageBlockAttributes(
				{ linkDestination: 'none' },
				croppedAttachment
			)
		).toEqual( {} );
		expect(
			getNewAttachmentImageBlockAttributes( {}, croppedAttachment )
		).toEqual( {} );
	} );

	it( 'keeps the existing link when the new attachment record lacks it', () => {
		expect(
			getNewAttachmentImageBlockAttributes(
				{ linkDestination: 'media' },
				{ id: 2 }
			)
		).toEqual( {} );
		expect(
			getNewAttachmentImageBlockAttributes(
				{ linkDestination: 'attachment' },
				{ id: 2 }
			)
		).toEqual( {} );
	} );
} );
