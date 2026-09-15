import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { MediaEditorModal } from '../index';

let mockSaveResult: {
	id: number;
	url: string;
	media: { id: number; source_url: string };
	previous?: { id: number; url: string };
} = {
	id: 11,
	url: 'edited.jpg',
	media: { id: 11, source_url: 'edited.jpg' },
	previous: {
		id: 10,
		url: 'original.jpg',
	},
};
const mockOnUpdate = vi.fn();
const mockOnClose = vi.fn();
const mockCloseMediaEditorModal = vi.fn();
const mockCreateSuccessNotice = vi.fn();

vi.mock(
	import( '@wordpress/data' ),
	() =>
		( {
			useDispatch: vi.fn(),
			useSelect: vi.fn(),
		} ) as unknown as typeof import('@wordpress/data')
);

vi.mock(
	import( '@wordpress/components' ),
	() =>
		( {
			Modal: ( { children }: { children: ReactNode } ) => children,
		} ) as unknown as typeof import('@wordpress/components')
);

vi.mock(
	import( '@wordpress/keyboard-shortcuts' ),
	() =>
		( {
			ShortcutProvider: ( { children }: { children: ReactNode } ) =>
				children,
		} ) as unknown as typeof import('@wordpress/keyboard-shortcuts')
);

vi.mock(
	import( '@wordpress/notices' ),
	() =>
		( {
			store: { name: 'notices' },
		} ) as unknown as typeof import('@wordpress/notices')
);

vi.mock(
	import( '../../../store' ),
	() =>
		( {
			store: { name: 'media-editor' },
		} ) as unknown as typeof import('../../../store')
);

vi.mock( import( '../../media-editor' ), async () => {
	const { createElement } =
		await vi.importActual< typeof import('@wordpress/element') >(
			'@wordpress/element'
		);

	return {
		default: vi.fn( ( props ) =>
			createElement(
				'button',
				{ onClick: () => props.onSaved( mockSaveResult ) },
				'Save result'
			)
		),
	} as unknown as typeof import('../../media-editor');
} );

describe( 'MediaEditorModal', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		mockSaveResult = {
			id: 11,
			url: 'edited.jpg',
			media: { id: 11, source_url: 'edited.jpg' },
			previous: {
				id: 10,
				url: 'original.jpg',
			},
		};

		( useSelect as Mock ).mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				isOpen: () => true,
				getId: () => 10,
				getOnUpdate: () => mockOnUpdate,
				getOnClose: () => mockOnClose,
			} ) )
		);
		( useDispatch as Mock ).mockImplementation( ( store ) =>
			store === noticesStore
				? { createSuccessNotice: mockCreateSuccessNotice }
				: { closeMediaEditorModal: mockCloseMediaEditorModal }
		);
	} );

	it( 'shows an undo snackbar after saving dirty image editor state', () => {
		render( <MediaEditorModal /> );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Save result' } )
		);

		expect( mockOnUpdate ).toHaveBeenCalledWith( {
			id: 11,
			url: 'edited.jpg',
		} );
		expect( mockCloseMediaEditorModal ).toHaveBeenCalled();
		expect( mockOnClose ).toHaveBeenCalled();
		expect( mockCreateSuccessNotice ).toHaveBeenCalledWith(
			'Image edited.',
			expect.objectContaining( {
				type: 'snackbar',
				actions: [
					expect.objectContaining( {
						label: 'Undo',
						onClick: expect.any( Function ),
					} ),
				],
			} )
		);

		const noticeOptions = mockCreateSuccessNotice.mock.calls[ 0 ][ 1 ];
		expect( noticeOptions ).not.toHaveProperty( 'context' );

		noticeOptions.actions[ 0 ].onClick();

		expect( mockOnUpdate ).toHaveBeenLastCalledWith( {
			id: 10,
			url: 'original.jpg',
		} );
	} );

	it( 'does not show the image edited snackbar for metadata-only saves', () => {
		mockSaveResult = {
			...mockSaveResult,
			previous: undefined,
		};

		render( <MediaEditorModal /> );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Save result' } )
		);

		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
	} );
} );
