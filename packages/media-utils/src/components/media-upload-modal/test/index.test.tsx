/**
 * External dependencies
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { MediaUploadModal } from '../index';
import { unlock } from '../../../lock-unlock';

const preferenceKey = 'dataviews-postType-attachment-media-modal';

jest.mock( '@wordpress/core-data', () => {
	const { __dangerousOptInToUnstableAPIsOnlyForCoreModules } =
		jest.requireActual( '@wordpress/private-apis' );
	const { lock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
		'@wordpress/core-data'
	);
	// Keep the private API contract real while replacing only the data hook.
	const privateApis = {};
	lock( privateApis, {
		useEntityRecordsWithPermissions: jest.fn(),
	} );

	return {
		privateApis,
		store: {
			name: 'core',
		},
	};
} );

const mockUseEntityRecordsWithPermissions = unlock( coreDataPrivateApis )
	.useEntityRecordsWithPermissions as jest.Mock;

const IMAGE_RECORDS = [
	{
		id: 1,
		title: { raw: 'Cat', rendered: 'Cat' },
		media_type: 'image',
		mime_type: 'image/png',
		source_url: 'https://example.com/cat.png',
		alt_text: '',
	},
	{
		id: 2,
		title: { raw: 'Dog', rendered: 'Dog' },
		media_type: 'image',
		mime_type: 'image/png',
		source_url: 'https://example.com/dog.png',
		alt_text: '',
	},
];

function mockRecords( records: unknown[] ) {
	mockUseEntityRecordsWithPermissions.mockReturnValue( {
		records,
		isResolving: false,
		totalItems: records.length,
		totalPages: 1,
	} );
}

type ModalProps = { isOpen?: boolean; value?: number | number[] };

function renderModal( { isOpen = true, value }: ModalProps = {} ) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( preferencesStore );

	const onSelect = jest.fn();
	const onClose = jest.fn();

	const view = render(
		<RegistryProvider value={ registry }>
			<MediaUploadModal
				isOpen={ isOpen }
				value={ value }
				onSelect={ onSelect }
				onClose={ onClose }
			/>
		</RegistryProvider>
	);

	const rerender = ( props: ModalProps ) => {
		view.rerender(
			<RegistryProvider value={ registry }>
				<MediaUploadModal
					{ ...props }
					onSelect={ onSelect }
					onClose={ onClose }
				/>
			</RegistryProvider>
		);
	};

	return { ...view, registry, rerender };
}

describe( 'MediaUploadModal', () => {
	beforeEach( () => {
		mockUseEntityRecordsWithPermissions.mockReturnValue( {
			records: [],
			isResolving: false,
			totalItems: 100,
			totalPages: 2,
		} );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'resets page and search when the modal is closed and reopened', async () => {
		const user = userEvent.setup();
		const { rerender } = renderModal();

		await user.click( screen.getByRole( 'button', { name: 'Next page' } ) );

		await waitFor( () => {
			expect(
				mockUseEntityRecordsWithPermissions
			).toHaveBeenLastCalledWith(
				'postType',
				'attachment',
				expect.objectContaining( { page: 2 } )
			);
		} );

		// Close the modal.
		rerender( { isOpen: false } );

		// Reopen the modal.
		rerender( { isOpen: true } );

		await waitFor( () => {
			expect(
				mockUseEntityRecordsWithPermissions
			).toHaveBeenLastCalledWith(
				'postType',
				'attachment',
				expect.objectContaining( { page: 1, search: '' } )
			);
		} );
	} );

	it( 'clears a user selection when the modal is closed and reopened', async () => {
		const user = userEvent.setup();
		mockRecords( IMAGE_RECORDS );

		const { rerender } = renderModal();

		const options = within( screen.getByRole( 'listbox' ) ).getAllByRole(
			'option'
		);
		await user.click( options[ 0 ] );
		expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );

		// The modal instance stays mounted between opens, so the selection must
		// be reset rather than persisting into the next open session.
		rerender( { isOpen: false } );
		rerender( { isOpen: true } );

		const reopenedOptions = within(
			screen.getByRole( 'listbox' )
		).getAllByRole( 'option' );
		expect( reopenedOptions[ 0 ] ).toHaveAttribute(
			'aria-selected',
			'false'
		);
	} );

	it( 'seeds the selection from `value`, reflecting an external change on the next open', async () => {
		mockRecords( IMAGE_RECORDS );

		// Opens with item 1 pre-selected via `value`.
		const { rerender } = renderModal( { value: 1 } );

		const options = within( screen.getByRole( 'listbox' ) ).getAllByRole(
			'option'
		);
		expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
		expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'false' );

		// Close first (still item 1), THEN change `value` to item 2 while the
		// modal is closed. Keeping these as separate steps is what makes this
		// exercise the open path: if the selection were only re-seeded on close,
		// it would still hold item 1 on reopen.
		rerender( { isOpen: false, value: 1 } );
		rerender( { isOpen: false, value: 2 } );
		rerender( { isOpen: true, value: 2 } );

		const reopenedOptions = within(
			screen.getByRole( 'listbox' )
		).getAllByRole( 'option' );
		expect( reopenedOptions[ 0 ] ).toHaveAttribute(
			'aria-selected',
			'false'
		);
		expect( reopenedOptions[ 1 ] ).toHaveAttribute(
			'aria-selected',
			'true'
		);
	} );

	it( 'updates the media query when the picker changes page', async () => {
		const user = userEvent.setup();
		const { registry } = renderModal();

		expect( mockUseEntityRecordsWithPermissions ).toHaveBeenLastCalledWith(
			'postType',
			'attachment',
			expect.objectContaining( {
				page: 1,
			} )
		);

		await user.click( screen.getByRole( 'button', { name: 'Next page' } ) );

		await waitFor( () => {
			expect(
				mockUseEntityRecordsWithPermissions
			).toHaveBeenLastCalledWith(
				'postType',
				'attachment',
				expect.objectContaining( {
					page: 2,
				} )
			);
		} );
		expect(
			registry
				.select( preferencesStore )
				.get( 'core/views', preferenceKey )
		).toBeUndefined();
	} );

	it( 'updates the media query when the picker changes search', async () => {
		const user = userEvent.setup();
		const { registry } = renderModal();

		await user.type(
			screen.getByRole( 'searchbox', { name: 'Search media' } ),
			'cat'
		);

		await waitFor( () => {
			expect(
				mockUseEntityRecordsWithPermissions
			).toHaveBeenLastCalledWith(
				'postType',
				'attachment',
				expect.objectContaining( {
					page: 1,
					search: 'cat',
				} )
			);
		} );
		expect(
			registry
				.select( preferencesStore )
				.get( 'core/views', preferenceKey )
		).toBeUndefined();
	} );
} );
