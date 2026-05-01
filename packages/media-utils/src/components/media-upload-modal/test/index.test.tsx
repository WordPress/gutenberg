/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
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

function renderModal() {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( preferencesStore );

	const view = render(
		<RegistryProvider value={ registry }>
			<MediaUploadModal
				isOpen
				onSelect={ jest.fn() }
				onClose={ jest.fn() }
			/>
		</RegistryProvider>
	);

	return { ...view, registry };
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
