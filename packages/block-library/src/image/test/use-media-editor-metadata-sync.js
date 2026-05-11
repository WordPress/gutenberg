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
import { useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useMediaEditorMetadataSync } from '../use-media-editor-metadata-sync';

jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

jest.mock( '@wordpress/data', () => ( {
	useRegistry: jest.fn(),
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

describe( 'useMediaEditorMetadataSync', () => {
	beforeEach( () => {
		jest.clearAllMocks();
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
		const registry = createRegistry( {
			getEntityRecord: () => originalAttachment,
			resolveGetEntityRecord: () => updatedAttachment,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		const { result } = renderHook( () =>
			useMediaEditorMetadataSync( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: 'Original alt',
					caption: 'Original caption',
				},
				image: originalAttachment,
				setAttributes,
				openMediaEditorModal,
			} )
		);

		act( () => {
			result.current();
		} );
		await act( async () => {
			await openMediaEditorModal.mock.calls[ 0 ][ 0 ].onUpdate( {
				id: 1,
				url: 'updated.jpg',
			} );
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
			[ 'postType', 'attachment', 1, { context: 'view' } ]
		);
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
		const registry = createRegistry( {
			getEntityRecord: ( kind, name, attachmentId ) =>
				attachmentId === 1 ? originalAttachment : undefined,
			resolveGetEntityRecord: ( kind, name, attachmentId ) =>
				attachmentId === 2 ? updatedAttachment : undefined,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		const { result } = renderHook( () =>
			useMediaEditorMetadataSync( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: '',
				},
				image: originalAttachment,
				setAttributes,
				openMediaEditorModal,
			} )
		);

		act( () => {
			result.current();
		} );
		await act( async () => {
			await openMediaEditorModal.mock.calls[ 0 ][ 0 ].onUpdate( {
				id: 2,
				url: 'cropped.jpg',
			} );
		} );

		expect( setAttributes ).toHaveBeenNthCalledWith( 1, {
			id: 2,
			url: 'cropped.jpg',
		} );
		expect( setAttributes ).toHaveBeenNthCalledWith( 2, {
			alt: 'Updated alt',
			caption: 'Updated caption',
		} );
	} );

	it( 'resolves fresh metadata when the new attachment id has an incomplete cached record', async () => {
		const originalAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: '' },
		};
		const cachedAttachment = {
			id: 2,
			alt_text: 'Updated alt',
			caption: { raw: '' },
		};
		const updatedAttachment = {
			id: 2,
			alt_text: 'Updated alt',
			caption: { raw: 'Updated caption' },
		};
		const registry = createRegistry( {
			getEntityRecord: ( kind, name, attachmentId ) =>
				attachmentId === 1 ? originalAttachment : cachedAttachment,
			resolveGetEntityRecord: ( kind, name, attachmentId ) =>
				attachmentId === 2 ? updatedAttachment : undefined,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		const { result } = renderHook( () =>
			useMediaEditorMetadataSync( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: '',
				},
				image: originalAttachment,
				setAttributes,
				openMediaEditorModal,
			} )
		);

		act( () => {
			result.current();
		} );
		await act( async () => {
			await openMediaEditorModal.mock.calls[ 0 ][ 0 ].onUpdate( {
				id: 2,
				url: 'cropped.jpg',
			} );
		} );

		expect( setAttributes ).toHaveBeenNthCalledWith( 1, {
			id: 2,
			url: 'cropped.jpg',
		} );
		expect( setAttributes ).toHaveBeenNthCalledWith( 2, {
			alt: 'Updated alt',
			caption: 'Updated caption',
		} );
	} );

	it( 'syncs new caption to a block with no caption when the view-context attachment has an existing caption', async () => {
		// This tests the core failing scenario: the attachment already has a caption
		// (e.g. set at upload time), the image block has no caption (was added via a
		// path that didn't include the caption), and the user opens the media editor
		// to update the caption. The block should receive the new caption.
		const viewContextAttachment = {
			id: 1,
			alt_text: '',
			caption: { rendered: '<p>Existing caption</p>' },
		};
		const updatedAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: 'New caption' },
		};
		const registry = createRegistry( {
			getEntityRecord: ( kind, name, id, query ) =>
				query?.context === 'view' ? viewContextAttachment : undefined,
			resolveGetEntityRecord: () => updatedAttachment,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		const { result } = renderHook( () =>
			useMediaEditorMetadataSync( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: undefined,
				},
				image: undefined,
				setAttributes,
				openMediaEditorModal,
			} )
		);

		act( () => {
			result.current();
		} );
		await act( async () => {
			await openMediaEditorModal.mock.calls[ 0 ][ 0 ].onUpdate( {
				id: 1,
				url: 'original.jpg',
			} );
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			caption: 'New caption',
		} );
	} );

	it( 'syncs metadata from an empty block when the original attachment is not cached', async () => {
		const updatedAttachment = {
			id: 1,
			alt_text: 'Updated alt',
			caption: { raw: 'Updated caption' },
		};
		const registry = createRegistry( {
			resolveGetEntityRecord: () => updatedAttachment,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		const { result } = renderHook( () =>
			useMediaEditorMetadataSync( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: '',
				},
				image: undefined,
				setAttributes,
				openMediaEditorModal,
			} )
		);

		act( () => {
			result.current();
		} );
		await act( async () => {
			await openMediaEditorModal.mock.calls[ 0 ][ 0 ].onUpdate( {
				id: 1,
				url: 'updated.jpg',
			} );
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			alt: 'Updated alt',
			caption: 'Updated caption',
		} );
	} );

	it( 'does not overwrite custom captions when the original attachment is not cached', async () => {
		const updatedAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: 'Updated caption' },
		};
		const registry = createRegistry( {
			resolveGetEntityRecord: () => updatedAttachment,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		const { result } = renderHook( () =>
			useMediaEditorMetadataSync( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: 'Custom caption',
				},
				image: undefined,
				setAttributes,
				openMediaEditorModal,
			} )
		);

		act( () => {
			result.current();
		} );
		await act( async () => {
			await openMediaEditorModal.mock.calls[ 0 ][ 0 ].onUpdate( {
				id: 1,
				url: 'updated.jpg',
			} );
		} );

		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'does not sync metadata changed locally while fresh attachment metadata is resolving', async () => {
		const originalAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: '' },
		};
		const updatedAttachment = {
			id: 1,
			alt_text: 'Attachment alt',
			caption: { raw: 'Attachment caption' },
		};
		const deferredAttachment = createDeferred();
		const registry = createRegistry( {
			getEntityRecord: () => originalAttachment,
			resolveGetEntityRecord: () => deferredAttachment.promise,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		const useHookWithAttributes = ( attributes ) =>
			useMediaEditorMetadataSync( {
				attributes,
				image: originalAttachment,
				setAttributes,
				openMediaEditorModal,
			} );
		const { result, rerender } = renderHook(
			( { attributes } ) => useHookWithAttributes( attributes ),
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

		act( () => {
			result.current();
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
