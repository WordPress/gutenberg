import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { MediaUploadModal } from '../index';
import { unlock } from '../../../lock-unlock';

const preferenceKey = 'dataviews-postType-attachment-media-modal';

// Only the labels the modal reads. `getPostType` is resolved through core-data
// in the real editor; here a minimal store named `core` stands in for it.
const POST_TYPES: Record< string, unknown > = {
	post: { labels: { uploaded_to_this_item: 'Uploaded to this post' } },
	page: { labels: { uploaded_to_this_item: 'Uploaded to this page' } },
	// A post type that never set the label.
	cpt: { labels: {} },
};

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

type ModalProps = {
	isOpen?: boolean;
	value?: number | number[];
	postId?: number;
	postType?: string;
};

function renderModal(
	{ isOpen = true, value, postId, postType }: ModalProps = {},
	persistedView?: Record< string, unknown >
) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( preferencesStore );
	registry.registerStore( 'core', {
		reducer: ( state = {} ) => state,
		selectors: {
			getPostType: ( state: unknown, slug: string ) => POST_TYPES[ slug ],
		},
	} );

	if ( persistedView ) {
		registry
			.dispatch( preferencesStore )
			.set( 'core/views', preferenceKey, persistedView );
	}

	const onSelect = jest.fn();
	const onClose = jest.fn();

	const view = render(
		<RegistryProvider value={ registry }>
			<MediaUploadModal
				isOpen={ isOpen }
				value={ value }
				postId={ postId }
				postType={ postType }
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
		// The popover fallback container is appended to `document.body`, outside
		// the tree Testing Library cleans up. Left in place, the next modal to
		// open marks it `aria-hidden` — hiding the popovers that later tests
		// render into it — so it is removed and recreated per test. This is DOM
		// teardown outside the rendered tree, not a query for an element under
		// test, so Testing Library has nothing to offer here.
		/* eslint-disable testing-library/no-node-access */
		document
			.querySelectorAll( '.components-popover__fallback-container' )
			.forEach( ( node ) => node.remove() );
		/* eslint-enable testing-library/no-node-access */
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

	describe( 'the "Attached to" filter', () => {
		it( 'offers the current post only when the modal knows one', async () => {
			const user = userEvent.setup();
			const { rerender } = renderModal( {
				postId: 42,
				postType: 'post',
			} );

			await user.click(
				screen.getByRole( 'button', { name: 'Add filter' } )
			);
			await user.click(
				await screen.findByRole( 'menuitem', { name: 'Attached to' } )
			);

			expect(
				await screen.findByRole( 'option', {
					name: 'Uploaded to this post',
				} )
			).toBeVisible();
			expect(
				screen.getByRole( 'option', { name: 'Unattached' } )
			).toBeVisible();

			// Outside a post context, only "Unattached" is meaningful.
			rerender( { isOpen: true } );

			await waitFor( () => {
				expect(
					screen.queryByRole( 'option', {
						name: 'Uploaded to this post',
					} )
				).not.toBeInTheDocument();
			} );
			expect(
				screen.getByRole( 'option', { name: 'Unattached' } )
			).toBeVisible();
		} );

		it( "labels the option with the post type's own wording", async () => {
			const user = userEvent.setup();
			renderModal( { postId: 42, postType: 'page' } );

			await user.click(
				screen.getByRole( 'button', { name: 'Add filter' } )
			);
			await user.click(
				await screen.findByRole( 'menuitem', { name: 'Attached to' } )
			);

			expect(
				await screen.findByRole( 'option', {
					name: 'Uploaded to this page',
				} )
			).toBeVisible();
		} );

		it( 'falls back to a generic label when the post type has none', async () => {
			const user = userEvent.setup();
			renderModal( { postId: 42, postType: 'cpt' } );

			await user.click(
				screen.getByRole( 'button', { name: 'Add filter' } )
			);
			await user.click(
				await screen.findByRole( 'menuitem', { name: 'Attached to' } )
			);

			expect(
				await screen.findByRole( 'option', {
					name: 'Uploaded to this item',
				} )
			).toBeVisible();
		} );

		it( 'ignores a post ID that is not a number', async () => {
			const user = userEvent.setup();
			// A template's entity ID is a slug rather than a post ID, and media
			// can't be uploaded to one.
			renderModal( {
				postId: 'twentytwentyfive//index' as unknown as number,
				postType: 'wp_template',
			} );

			await user.click(
				screen.getByRole( 'button', { name: 'Add filter' } )
			);
			await user.click(
				await screen.findByRole( 'menuitem', { name: 'Attached to' } )
			);

			expect(
				await screen.findByRole( 'option', { name: 'Unattached' } )
			).toBeVisible();
			expect(
				screen.queryByRole( 'option', {
					name: 'Uploaded to this post',
				} )
			).not.toBeInTheDocument();
		} );

		it( 'stops constraining the query when the chosen option is clicked again', async () => {
			const user = userEvent.setup();
			renderModal( { postId: 42, postType: 'post' } );

			await user.click(
				screen.getByRole( 'button', { name: 'Add filter' } )
			);
			await user.click(
				await screen.findByRole( 'menuitem', { name: 'Attached to' } )
			);

			const unattached = await screen.findByRole( 'option', {
				name: 'Unattached',
			} );
			await user.click( unattached );

			await waitFor( () => {
				expect(
					mockUseEntityRecordsWithPermissions
				).toHaveBeenLastCalledWith(
					'postType',
					'attachment',
					expect.objectContaining( { parent: [ 0 ] } )
				);
			} );

			// Clicking the selected option again deselects it. The filter stays
			// in the view with an empty value, which must read as "no constraint"
			// rather than as "attached to nothing".
			await user.click( unattached );

			await waitFor( () => {
				expect(
					mockUseEntityRecordsWithPermissions
				).toHaveBeenLastCalledWith(
					'postType',
					'attachment',
					expect.not.objectContaining( { parent: expect.anything() } )
				);
			} );
		} );

		it( 'queries both options together as a single `parent` list', async () => {
			const user = userEvent.setup();
			renderModal( { postId: 42, postType: 'post' } );

			await user.click(
				screen.getByRole( 'button', { name: 'Add filter' } )
			);
			await user.click(
				await screen.findByRole( 'menuitem', { name: 'Attached to' } )
			);
			await user.click(
				await screen.findByRole( 'option', {
					name: 'Uploaded to this post',
				} )
			);
			await user.click(
				screen.getByRole( 'option', { name: 'Unattached' } )
			);

			await waitFor( () => {
				expect(
					mockUseEntityRecordsWithPermissions
				).toHaveBeenLastCalledWith(
					'postType',
					'attachment',
					expect.objectContaining( { parent: [ 42, 0 ] } )
				);
			} );
		} );

		it( 'queries media uploaded to the post as its `parent`', async () => {
			const user = userEvent.setup();
			renderModal( { postId: 42, postType: 'post' } );

			await user.click(
				screen.getByRole( 'button', { name: 'Add filter' } )
			);
			await user.click(
				await screen.findByRole( 'menuitem', { name: 'Attached to' } )
			);
			await user.click(
				await screen.findByRole( 'option', {
					name: 'Uploaded to this post',
				} )
			);

			await waitFor( () => {
				expect(
					mockUseEntityRecordsWithPermissions
				).toHaveBeenLastCalledWith(
					'postType',
					'attachment',
					expect.objectContaining( { parent: [ 42 ] } )
				);
			} );
		} );

		it( 'does not persist the filter', async () => {
			// Unlike author or mime type, scoping the library to a post — or to
			// unattached media — is about the task at hand, not a standing
			// preference. Carrying it into the next post would quietly hide most
			// of the library.
			const user = userEvent.setup();
			const { registry } = renderModal( {
				postId: 42,
				postType: 'post',
			} );

			await user.click(
				screen.getByRole( 'button', { name: 'Add filter' } )
			);
			await user.click(
				await screen.findByRole( 'menuitem', { name: 'Attached to' } )
			);
			await user.click(
				await screen.findByRole( 'option', { name: 'Unattached' } )
			);

			await waitFor( () => {
				expect(
					mockUseEntityRecordsWithPermissions
				).toHaveBeenLastCalledWith(
					'postType',
					'attachment',
					expect.objectContaining( { parent: [ 0 ] } )
				);
			} );
			expect(
				registry
					.select( preferencesStore )
					.get( 'core/views', preferenceKey )
			).toBeUndefined();
		} );

		it( 'keeps the filter while the picker stays on screen', async () => {
			const user = userEvent.setup();
			const { rerender } = renderModal( {
				postId: 42,
				postType: 'post',
			} );

			await user.click(
				screen.getByRole( 'button', { name: 'Add filter' } )
			);
			await user.click(
				await screen.findByRole( 'menuitem', { name: 'Attached to' } )
			);
			await user.click(
				await screen.findByRole( 'option', { name: 'Unattached' } )
			);

			// Closing and reopening is the same instance: the choice stands.
			rerender( { isOpen: false, postId: 42, postType: 'post' } );
			rerender( { isOpen: true, postId: 42, postType: 'post' } );

			await waitFor( () => {
				expect(
					mockUseEntityRecordsWithPermissions
				).toHaveBeenLastCalledWith(
					'postType',
					'attachment',
					expect.objectContaining( { parent: [ 0 ] } )
				);
			} );
		} );

		it( 'ignores an `attached_to` filter left in the persisted view', async () => {
			renderModal(
				{ postId: 42, postType: 'post' },
				{
					filters: [
						{
							field: 'attached_to',
							operator: 'isAny',
							value: [ 'current' ],
						},
					],
				}
			);

			await waitFor( () => {
				expect(
					mockUseEntityRecordsWithPermissions
				).toHaveBeenCalled();
			} );
			expect(
				mockUseEntityRecordsWithPermissions
			).toHaveBeenLastCalledWith(
				'postType',
				'attachment',
				expect.not.objectContaining( { parent: expect.anything() } )
			);
			expect(
				screen.queryByRole( 'button', { name: /Attached to/ } )
			).not.toBeInTheDocument();
		} );
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
