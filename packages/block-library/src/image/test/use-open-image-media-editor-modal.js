/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	getImageBlockMetadataFromAttachment,
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
	getEntityRecord = () => undefined,
	resolveGetEntityRecord = getEntityRecord,
} = {} ) {
	const actions = {
		invalidateResolution: jest.fn(),
	};
	return {
		select: jest.fn( () => ( {
			getEditedEntityRecord,
			getEntityRecord,
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
} ) {
	const registry = createRegistry( registryOptions );
	useRegistry.mockReturnValue( registry );
	const setAttributes = jest.fn();
	const openMediaEditorModal = jest.fn();
	mockMediaEditorModalSetting( openMediaEditorModal );
	const { result } = renderHook( () =>
		useOpenImageMediaEditorModal( { attributes, setAttributes } )
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

describe( 'useOpenImageMediaEditorModal', () => {
	beforeEach( () => {
		jest.clearAllMocks();
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
				getEntityRecord: () => originalAttachment,
				resolveGetEntityRecord: ( kind, name, attachmentId, query ) =>
					query?.context === 'edit'
						? updatedAttachment
						: originalAttachment,
			},
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			alt: 'Updated alt',
			caption: 'Updated caption',
		} );
		expect( registry.actions.invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecord',
			[ 'postType', 'attachment', 1 ]
		);
		expect( registry.actions.invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecord',
			[ 'postType', 'attachment', 1, { context: 'edit' } ]
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
			1,
			{ context: 'edit' }
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
			1,
			{ context: 'edit' }
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
				getEntityRecord: () => ( {
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
			1,
			{ context: 'edit' }
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
				getEntityRecord: ( kind, name, attachmentId ) =>
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
			getEntityRecord: ( kind, name, attachmentId ) =>
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
				getEntityRecord: ( kind, name, attachmentId ) =>
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
				getEntityRecord: () => ( {
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
				getEntityRecord: () => ( {
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
				getEntityRecord: () => ( {
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
			getEntityRecord: () => ( {
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
