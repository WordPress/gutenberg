import { render, screen, fireEvent } from '@testing-library/react';
import { applyFilters } from '@wordpress/hooks';

// Stub the private MediaUploadModal so we can trigger onSelect/onClose
// from the test, and a stub MediaUpload for the non-experimental branch.
jest.mock( '@wordpress/media-utils', () => ( {
	MediaUpload: () => null,
	privateApis: {},
} ) );

jest.mock( '@wordpress/private-apis', () => ( {
	__dangerousOptInToUnstableAPIsOnlyForCoreModules: () => ( {
		lock: () => {},
		unlock: () => ( {
			MediaUploadModal: ( { isOpen, onSelect, onClose } ) =>
				isOpen ? (
					<div>
						<button
							onClick={ () =>
								onSelect( { id: 1, url: 'test.jpg' } )
							}
						>
							Select Media
						</button>
						<button onClick={ onClose }>Close Modal</button>
					</div>
				) : null,
		} ),
	} ),
} ) );

describe( 'MediaUploadModalWrapper', () => {
	beforeEach( () => {
		window.__experimentalDataViewsMediaModal = true;
	} );

	function getWrapper() {
		// Registers the filter as a side effect of importing the module.
		require( '../media-upload' );
		return applyFilters( 'editor.MediaUpload', null );
	}

	it( 'renders the render-prop trigger, modal closed initially', () => {
		const MediaUploadModalWrapper = getWrapper();
		render(
			<MediaUploadModalWrapper
				onSelect={ jest.fn() }
				render={ ( { open } ) => (
					<button onClick={ open }>Open</button>
				) }
			/>
		);

		expect( console ).toHaveWarned();
		expect(
			screen.getByRole( 'button', { name: 'Open' } )
		).toBeInTheDocument();
		expect( screen.queryByText( 'Select Media' ) ).not.toBeInTheDocument();
	} );

	it( 'opens the modal when open() is called', () => {
		const MediaUploadModalWrapper = getWrapper();
		render(
			<MediaUploadModalWrapper
				onSelect={ jest.fn() }
				render={ ( { open } ) => (
					<button onClick={ open }>Open</button>
				) }
			/>
		);

		fireEvent.click( screen.getByText( 'Open' ) );

		expect( screen.getByText( 'Select Media' ) ).toBeInTheDocument();
	} );

	it( 'calls onSelect and closes modal on select', () => {
		const MediaUploadModalWrapper = getWrapper();
		const onSelect = jest.fn();
		render(
			<MediaUploadModalWrapper
				onSelect={ onSelect }
				render={ ( { open } ) => (
					<button onClick={ open }>Open</button>
				) }
			/>
		);

		fireEvent.click( screen.getByText( 'Open' ) );
		fireEvent.click( screen.getByText( 'Select Media' ) );

		expect( onSelect ).toHaveBeenCalledWith( {
			id: 1,
			url: 'test.jpg',
		} );
		expect( screen.queryByText( 'Select Media' ) ).not.toBeInTheDocument();
	} );

	it( 'calls onClose when closed without selecting', () => {
		const MediaUploadModalWrapper = getWrapper();
		const onClose = jest.fn();
		render(
			<MediaUploadModalWrapper
				onSelect={ jest.fn() }
				onClose={ onClose }
				render={ ( { open } ) => (
					<button onClick={ open }>Open</button>
				) }
			/>
		);

		fireEvent.click( screen.getByText( 'Open' ) );
		fireEvent.click( screen.getByText( 'Close Modal' ) );

		expect( onClose ).toHaveBeenCalled();
		expect( screen.queryByText( 'Select Media' ) ).not.toBeInTheDocument();
	} );
} );
