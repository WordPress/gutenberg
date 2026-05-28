/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { MediaEditorModal } from '../index';

let mockSaveResult = {
	id: 11,
	url: 'edited.jpg',
	media: { id: 11, source_url: 'edited.jpg' },
	previous: {
		id: 10,
		url: 'original.jpg',
	},
};
const mockOnUpdate = jest.fn();
const mockOnClose = jest.fn();
const mockCloseMediaEditorModal = jest.fn();
const mockCreateSuccessNotice = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Modal: ( { children } ) => children,
} ) );

jest.mock( '@wordpress/keyboard-shortcuts', () => ( {
	ShortcutProvider: ( { children } ) => children,
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: { name: 'notices' },
} ) );

jest.mock( '../../../store', () => ( {
	store: { name: 'media-editor' },
} ) );

jest.mock( '../../media-editor', () => {
	const { createElement } = jest.requireActual( '@wordpress/element' );

	return {
		__esModule: true,
		default: jest.fn( ( props ) =>
			createElement(
				'button',
				{ onClick: () => props.onSaved( mockSaveResult ) },
				'Save result'
			)
		),
	};
} );

describe( 'MediaEditorModal', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockSaveResult = {
			id: 11,
			url: 'edited.jpg',
			media: { id: 11, source_url: 'edited.jpg' },
			previous: {
				id: 10,
				url: 'original.jpg',
			},
		};

		( useSelect as jest.Mock ).mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				isOpen: () => true,
				getId: () => 10,
				getOnUpdate: () => mockOnUpdate,
				getOnClose: () => mockOnClose,
			} ) )
		);
		( useDispatch as jest.Mock ).mockImplementation( ( store ) =>
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
