import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useRegistry } from '@wordpress/data';
import { useSaveMediaEditor } from '../use-save-media-editor';
import { createPendingCropPreview } from '../pending-crop';
import type { MediaEditorSession } from '../../../state';
import type { Media } from '../../media-editor-provider';

vi.mock(
	import( '@wordpress/api-fetch' ),
	() =>
		( {
			default: vi.fn(),
		} ) as unknown as typeof import( '@wordpress/api-fetch' )
);

vi.mock(
	import( '@wordpress/data' ),
	() =>
		( {
			useDispatch: vi.fn(),
			useRegistry: vi.fn(),
		} ) as unknown as typeof import( '@wordpress/data' )
);

vi.mock(
	import( '@wordpress/core-data' ),
	() =>
		( {
			store: { name: 'core' },
		} ) as unknown as typeof import( '@wordpress/core-data' )
);

vi.mock(
	import( '@wordpress/notices' ),
	() =>
		( {
			store: { name: 'notices' },
		} ) as unknown as typeof import( '@wordpress/notices' )
);

vi.mock( import( '../pending-crop' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	createPendingCropPreview: vi.fn(),
} ) );

const IMAGE = { src: 'original.jpg', naturalWidth: 1200, naturalHeight: 600 };

const MEDIA = {
	id: 10,
	source_url: 'original.jpg',
	mime_type: 'image/jpeg',
	post: 5,
} as unknown as Media;

const mockSaveEditedEntityRecord = vi.fn();
const mockReceiveEntityRecords = vi.fn();
const mockClearEntityRecordEdits = vi.fn();
const mockCreateErrorNotice = vi.fn();
let mockHasEdits = false;

function getSession(): MediaEditorSession {
	return {
		cropper: {
			state: {
				image: IMAGE,
				pan: { x: 0, y: 0 },
				zoom: 1,
				rotation: 90,
				basePan: { x: 0, y: 0 },
				baseZoom: 1,
				baseRotation: 90,
				flip: { horizontal: false, vertical: false },
				cropRect: { x: 0, y: 0, width: 1, height: 1 },
			},
			reset: vi.fn(),
		},
		cropOptions: { aspectRatioValue: '0' },
		hasOutputEdits: true,
	} as unknown as MediaEditorSession;
}

async function save(
	deferCrop: boolean,
	replacementSource?: Parameters<
		typeof useSaveMediaEditor
	>[ 0 ][ 'replacementSource' ]
) {
	const onSaved = vi.fn();
	const { result } = renderHook( () =>
		useSaveMediaEditor( {
			session: getSession(),
			deferCrop,
			id: 10,
			isImage: true,
			media: MEDIA,
			onSaved,
			replacementSource,
		} )
	);
	await act( () => result.current.save() );
	return onSaved;
}

describe( 'useSaveMediaEditor', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		mockHasEdits = false;
		( useRegistry as Mock ).mockReturnValue( {
			select: () => ( {
				getEntityRecordNonTransientEdits: () => undefined,
				hasEditsForEntityRecord: () => mockHasEdits,
			} ),
		} );
		( useDispatch as Mock ).mockReturnValue( {
			clearEntityRecordEdits: mockClearEntityRecordEdits,
			receiveEntityRecords: mockReceiveEntityRecords,
			saveEditedEntityRecord: mockSaveEditedEntityRecord,
			createErrorNotice: mockCreateErrorNotice,
			removeAllNotices: vi.fn(),
		} );
		mockSaveEditedEntityRecord.mockResolvedValue( undefined );
		( apiFetch as unknown as Mock ).mockResolvedValue( {
			id: 11,
			source_url: 'cropped.jpg',
		} );
		( createPendingCropPreview as Mock ).mockResolvedValue(
			'blob:cropped'
		);
	} );

	it( 'saves a crop straight away by default', async () => {
		const onSaved = await save( false );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: '/wp/v2/media/10/edit' } )
		);
		expect( onSaved ).toHaveBeenCalledWith(
			expect.objectContaining( { id: 11 } )
		);
		expect( onSaved.mock.calls[ 0 ][ 0 ] ).not.toHaveProperty(
			'pendingCrop'
		);
	} );

	it( 'returns a deferred crop without calling /edit', async () => {
		const onSaved = await save( true );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( mockSaveEditedEntityRecord ).not.toHaveBeenCalled();
		expect( onSaved ).toHaveBeenCalledWith( {
			id: 10,
			url: 'original.jpg',
			media: MEDIA,
			pendingCrop: {
				modifiers: [ { type: 'rotate', args: { angle: 90 } } ],
				cropperState: expect.not.objectContaining( {
					image: expect.anything(),
				} ),
				aspectRatioValue: '0',
				previewUrl: 'blob:cropped',
			},
		} );
	} );

	it( 'falls back to saving the crop when the preview fails', async () => {
		( createPendingCropPreview as Mock ).mockRejectedValue(
			new Error( 'Tainted canvas' )
		);

		const onSaved = await save( true );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: '/wp/v2/media/10/edit' } )
		);
		expect( onSaved ).toHaveBeenCalledWith(
			expect.objectContaining( { id: 11 } )
		);
		expect( onSaved.mock.calls[ 0 ][ 0 ] ).not.toHaveProperty(
			'pendingCrop'
		);
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
		expect( console ).toHaveWarned();
	} );

	it( 'saves details edits when deferring a crop', async () => {
		mockHasEdits = true;

		await save( true );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( mockSaveEditedEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			10,
			{ throwOnError: true }
		);
	} );

	it( 'defers a crop of the restored original against the original', async () => {
		const original = {
			id: 5,
			source_url: 'root.jpg',
			mime_type: 'image/jpeg',
		} as unknown as Media;

		const onSaved = await save( true, {
			id: 5,
			url: 'root.jpg',
			media: original,
		} );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( onSaved ).toHaveBeenCalledWith(
			expect.objectContaining( {
				id: 5,
				url: 'root.jpg',
				media: original,
				pendingCrop: expect.any( Object ),
			} )
		);
	} );
} );
