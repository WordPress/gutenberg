import { render, screen } from '@testing-library/react';
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type Mock,
} from 'vitest';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { MediaUploadModal } from '../index';
import { unlock } from '../../../lock-unlock';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

vi.mock( import( '@wordpress/core-data' ), async () => {
	const { __dangerousOptInToUnstableAPIsOnlyForCoreModules } =
		await import( '@wordpress/private-apis' );
	const { lock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
		'@wordpress/core-data'
	);
	const privateApis = {};
	lock( privateApis, {
		useEntityRecordsWithPermissions: vi.fn(),
	} );

	return {
		privateApis,
		store: { name: 'core' },
	} as unknown as typeof import( '@wordpress/core-data' );
} );

const mockUseEntityRecordsWithPermissions = unlock( coreDataPrivateApis )
	.useEntityRecordsWithPermissions as Mock;

function renderModal( allowedTypes?: string[] ) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( preferencesStore );
	registry.registerStore( 'core', {
		reducer: ( state = {} ) => state,
		selectors: {
			getPostType: () => undefined,
		},
	} );

	const onSelect = vi.fn();
	const view = render(
		<RegistryProvider value={ registry }>
			<MediaUploadModal
				isOpen
				allowedTypes={ allowedTypes }
				onSelect={ onSelect }
			/>
		</RegistryProvider>
	);

	return {
		...view,
		rerenderModal: ( nextAllowedTypes?: string[] ) =>
			view.rerender(
				<RegistryProvider value={ registry }>
					<MediaUploadModal
						isOpen
						allowedTypes={ nextAllowedTypes }
						onSelect={ onSelect }
					/>
				</RegistryProvider>
			),
	};
}

describe( 'MediaUploadModal file picker', () => {
	beforeEach( () => {
		mockUseEntityRecordsWithPermissions.mockReturnValue( {
			records: [],
			isResolving: false,
			totalItems: 0,
			totalPages: 0,
		} );
	} );

	afterEach( () => {
		vi.clearAllMocks();
	} );

	it.each( [
		{ allowedTypes: [ 'image' ], accept: 'image/*' },
		{ allowedTypes: [ 'video' ], accept: 'video/*' },
		{ allowedTypes: [ 'image/png' ], accept: 'image/png' },
		{
			allowedTypes: [ 'image', 'video/mp4' ],
			accept: 'image/*,video/mp4',
		},
		{ allowedTypes: [ 'image/*' ], accept: 'image/*' },
		{
			allowedTypes: [ '.pdf', 'application/pdf' ],
			accept: '.pdf,application/pdf',
		},
		{ allowedTypes: [], accept: '' },
	] )( 'sets accept to $accept', ( { allowedTypes, accept } ) => {
		renderModal( allowedTypes );

		expect(
			screen.getByTestId( 'form-file-upload-input' )
		).toHaveAttribute( 'accept', accept );
	} );

	it( 'passes the audio wildcard through the real file upload component', () => {
		renderModal( [ 'audio' ] );

		// FormFileUpload supplements audio/* with MIME types for iOS.
		expect(
			screen.getByTestId( 'form-file-upload-input' )
		).toHaveAttribute(
			'accept',
			expect.stringMatching( /^audio\/\*(,|$)/ )
		);
	} );

	it.each( [ undefined, [ '*' ], [ '*', 'image' ] ] )(
		'leaves the file picker unrestricted for %j',
		( allowedTypes ) => {
			renderModal( allowedTypes );

			expect(
				screen.getByTestId( 'form-file-upload-input' )
			).not.toHaveAttribute( 'accept' );
		}
	);

	it( 'updates accepted types when the caller changes them', () => {
		const { rerenderModal } = renderModal( [ 'image' ] );

		rerenderModal( [ 'video' ] );

		expect(
			screen.getByTestId( 'form-file-upload-input' )
		).toHaveAttribute( 'accept', 'video/*' );
	} );
} );
