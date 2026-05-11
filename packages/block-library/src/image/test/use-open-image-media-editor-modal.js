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
import { useOpenImageMediaEditorModal } from '../use-open-image-media-editor-modal';

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

function useMediaEditorModalSetting( openMediaEditorModal ) {
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getSettings: () => ( {
				[ mockOpenMediaEditorModalKey ]: openMediaEditorModal,
			} ),
		} ) )
	);
}

describe( 'useOpenImageMediaEditorModal', () => {
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
		useMediaEditorModalSetting( openMediaEditorModal );
		const { result } = renderHook( () =>
			useOpenImageMediaEditorModal( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: 'Original alt',
					caption: 'Original caption',
				},
				setAttributes,
			} )
		);

		await act( async () => {
			await result.current();
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
		const registry = createRegistry( {
			resolveGetEntityRecord,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		useMediaEditorModalSetting( openMediaEditorModal );
		const { result } = renderHook( () =>
			useOpenImageMediaEditorModal( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: 'Original alt',
					caption: 'Original caption',
				},
				setAttributes,
			} )
		);

		await act( async () => {
			await result.current();
		} );
		await act( async () => {
			await openMediaEditorModal.mock.calls[ 0 ][ 0 ].onUpdate( {
				id: 1,
				url: 'updated.jpg',
			} );
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
		} );
		expect( setAttributes ).toHaveBeenCalledWith( {
			alt: 'Updated alt',
			caption: 'Updated caption',
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
		const registry = createRegistry( {
			getEntityRecord: ( kind, name, attachmentId ) =>
				attachmentId === 1 ? originalAttachment : undefined,
			resolveGetEntityRecord: ( kind, name, attachmentId ) =>
				attachmentId === 2 ? updatedAttachment : undefined,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		useMediaEditorModalSetting( openMediaEditorModal );
		const { result } = renderHook( () =>
			useOpenImageMediaEditorModal( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: '',
				},
				setAttributes,
			} )
		);

		await act( async () => {
			await result.current();
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
		useMediaEditorModalSetting( openMediaEditorModal );
		const { result } = renderHook( () =>
			useOpenImageMediaEditorModal( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: '',
				},
				setAttributes,
			} )
		);

		await act( async () => {
			await result.current();
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

	it( 'syncs new raw caption to a block with no caption when the original attachment has one', async () => {
		const originalAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: 'Existing caption' },
		};
		const updatedAttachment = {
			id: 1,
			alt_text: '',
			caption: { raw: 'New caption' },
		};
		const registry = createRegistry( {
			getEntityRecord: () => originalAttachment,
			resolveGetEntityRecord: () => updatedAttachment,
		} );
		useRegistry.mockReturnValue( registry );
		const setAttributes = jest.fn();
		const openMediaEditorModal = jest.fn();
		useMediaEditorModalSetting( openMediaEditorModal );
		const { result } = renderHook( () =>
			useOpenImageMediaEditorModal( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: undefined,
				},
				setAttributes,
			} )
		);

		await act( async () => {
			await result.current();
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
		useMediaEditorModalSetting( openMediaEditorModal );
		const { result } = renderHook( () =>
			useOpenImageMediaEditorModal( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: '',
				},
				setAttributes,
			} )
		);

		await act( async () => {
			await result.current();
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
		useMediaEditorModalSetting( openMediaEditorModal );
		const { result } = renderHook( () =>
			useOpenImageMediaEditorModal( {
				attributes: {
					id: 1,
					url: 'original.jpg',
					alt: '',
					caption: 'Custom caption',
				},
				setAttributes,
			} )
		);

		await act( async () => {
			await result.current();
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
		useMediaEditorModalSetting( openMediaEditorModal );
		const useHookWithAttributes = ( attributes ) =>
			useOpenImageMediaEditorModal( {
				attributes,
				setAttributes,
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
