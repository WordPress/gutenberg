import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
import type { Field } from '@wordpress/dataviews';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { MediaUploadModal } from '../index';
import { unlock } from '../../../lock-unlock';

globalThis.wpVitest.mockMatchMedia();

globalThis.wpVitest.mockResizeObserver();

const preferenceKey = 'dataviews-postType-attachment-media-modal';

// Only the labels the modal reads. `getPostType` is resolved through core-data
// in the real editor; here a minimal store named `core` stands in for it.
const POST_TYPES: Record< string, unknown > = {
	post: { labels: { uploaded_to_this_item: 'Uploaded to this post' } },
	page: { labels: { uploaded_to_this_item: 'Uploaded to this page' } },
	// A post type that never set the label.
	cpt: { labels: {} },
	attachment: { labels: {}, taxonomies: [ 'genre' ] },
};

const TAXONOMIES = [ { slug: 'genre', rest_base: 'genres' } ];

vi.mock( import( '@wordpress/core-data' ), async () => {
	const { __dangerousOptInToUnstableAPIsOnlyForCoreModules } =
		await import( '@wordpress/private-apis' );
	const { lock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
		'@wordpress/core-data'
	);
	// Keep the private API contract real while replacing only the data hook.
	const privateApis = {};
	lock( privateApis, {
		useEntityRecordsWithPermissions: vi.fn(),
	} );

	return {
		privateApis,
		store: {
			name: 'core',
		},
	} as unknown as typeof import( '@wordpress/core-data' );
} );

const mockUseEntityRecordsWithPermissions = unlock( coreDataPrivateApis )
	.useEntityRecordsWithPermissions as Mock;

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
	isOpen: boolean;
	isDismissible?: boolean;
	value?: number | number[];
	postId?: number;
	postType?: string;
	fields?: Field< any >[];
};

function renderModal(
	{
		isOpen = true,
		isDismissible = true,
		value,
		postId,
		postType,
		fields,
	}: Partial< ModalProps > = {},
	persistedView?: Record< string, unknown >
) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( preferencesStore );
	registry.registerStore( 'core', {
		reducer: ( state = {} ) => state,
		selectors: {
			getPostType: ( state: unknown, slug: string ) => POST_TYPES[ slug ],
			getTaxonomies: () => TAXONOMIES,
		},
	} );

	if ( persistedView ) {
		registry
			.dispatch( preferencesStore )
			.set( 'core/views', preferenceKey, persistedView );
	}

	const onSelect = vi.fn();
	const onClose = vi.fn();

	const view = render(
		<RegistryProvider value={ registry }>
			<MediaUploadModal
				isOpen={ isOpen }
				isDismissible={ isDismissible }
				value={ value }
				postId={ postId }
				postType={ postType }
				fields={ fields }
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

	return { ...view, registry, rerender, onClose };
}

describe( 'MediaUploadModal', () => {
	beforeEach( () => {
		vi.stubGlobal( '__wpUiCompatOverlaySlotEnabled', false );
		mockUseEntityRecordsWithPermissions.mockReturnValue( {
			records: [],
			isResolving: false,
			totalItems: 100,
			totalPages: 2,
		} );
	} );

	afterEach( () => {
		vi.clearAllMocks();
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

	it( 'keeps a non-dismissible picker open after Escape', async () => {
		const user = userEvent.setup();
		const { onClose } = renderModal( { isDismissible: false } );
		const dialog = await screen.findByRole( 'dialog', {
			name: 'Select Media',
		} );
		await user.keyboard( '{Escape}' );
		expect( dialog ).toBeVisible();
		expect( onClose ).not.toHaveBeenCalled();
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

		const options = within(
			await screen.findByRole( 'listbox' )
		).getAllByRole( 'option' );
		await user.click( options[ 0 ] );
		expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );

		// The modal instance stays mounted between opens, so the selection must
		// be reset rather than persisting into the next open session.
		rerender( { isOpen: false } );
		rerender( { isOpen: true } );

		const reopenedOptions = within(
			await screen.findByRole( 'listbox' )
		).getAllByRole( 'option' );
		expect( reopenedOptions[ 0 ] ).toHaveAttribute(
			'aria-selected',
			'false'
		);
		// Ariakit checks layout to validate virtual focus. jsdom has no layout.
		expect( console ).toHaveWarnedWith(
			'A composite widget with `virtualFocus` enabled requires a focusable composite element. Set the `focusable` prop to `true` or the `virtualFocus` option to `false`.'
		);
	} );

	it( 'seeds the selection from `value`, reflecting an external change on the next open', async () => {
		mockRecords( IMAGE_RECORDS );

		// Opens with item 1 pre-selected via `value`.
		const { rerender } = renderModal( { value: 1 } );

		const options = within(
			await screen.findByRole( 'listbox' )
		).getAllByRole( 'option' );
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
			await screen.findByRole( 'listbox' )
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

	it( 'renders while the media total is still unknown', async () => {
		mockUseEntityRecordsWithPermissions.mockReturnValue( {
			records: [],
			isResolving: true,
			totalItems: null,
			totalPages: null,
		} );

		renderModal();

		expect( await screen.findByText( '0 items' ) ).toBeInTheDocument();
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
			expect( console ).toHaveWarnedWith(
				'A composite widget with `virtualFocus` enabled requires a focusable composite element. Set the `focusable` prop to `true` or the `virtualFocus` option to `false`.'
			);
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
			expect( console ).toHaveWarnedWith(
				'A composite widget with `virtualFocus` enabled requires a focusable composite element. Set the `focusable` prop to `true` or the `virtualFocus` option to `false`.'
			);
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
			expect( console ).toHaveWarnedWith(
				'A composite widget with `virtualFocus` enabled requires a focusable composite element. Set the `focusable` prop to `true` or the `virtualFocus` option to `false`.'
			);
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
			expect( console ).toHaveWarnedWith(
				'A composite widget with `virtualFocus` enabled requires a focusable composite element. Set the `focusable` prop to `true` or the `virtualFocus` option to `false`.'
			);
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
			expect( console ).toHaveWarnedWith(
				'A composite widget with `virtualFocus` enabled requires a focusable composite element. Set the `focusable` prop to `true` or the `virtualFocus` option to `false`.'
			);
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

	it( 'queries a filter on a taxonomy field by the taxonomy', async () => {
		renderModal(
			{},
			{
				filters: [
					{ field: 'genres', operator: 'isNone', value: [ 3 ] },
				],
			}
		);

		await waitFor( () => {
			expect(
				mockUseEntityRecordsWithPermissions
			).toHaveBeenLastCalledWith(
				'postType',
				'attachment',
				expect.objectContaining( { genres_exclude: [ 3 ] } )
			);
		} );
	} );

	describe( 'registered fields', () => {
		const genreField = {
			id: 'genre',
			type: 'array',
			label: 'Genre',
			elements: [
				{ value: 3, label: 'Portrait' },
				{ value: 4, label: 'Landscape' },
			],
			filterBy: { operators: [ 'isAny' ] },
		} as Field< any >;

		it( 'shows a registered field as a column', async () => {
			mockRecords( IMAGE_RECORDS );
			for ( const { content, native } of [
				{ content: {}, native: '' },
				{ content: { header: <span>Genre</span> }, native: undefined },
				{
					content: { description: <span>Genre help</span> },
					native: undefined,
				},
			] ) {
				const { unmount } = renderModal(
					{ fields: [ { ...genreField, ...content } ] },
					{ type: 'pickerTable', fields: [ 'genre' ] }
				);
				expect(
					await screen.findByRole( 'columnheader', { name: /Genre/ } )
				).toBeInTheDocument();
				const dialog = screen.getByRole( 'dialog' );
				expect( dialog.dataset.wpUiOverlayModal ).toBe( native );
				unmount();
			}
		} );

		it( 'offers a registered field as a filter', async () => {
			const user = userEvent.setup();
			renderModal( { fields: [ genreField ] } );

			await user.click(
				screen.getByRole( 'button', { name: 'Add filter' } )
			);
			await user.click(
				await screen.findByRole( 'menuitem', { name: 'Genre' } )
			);

			expect(
				await screen.findByRole( 'option', { name: 'Portrait' } )
			).toBeVisible();
			expect(
				screen.getByRole( 'option', { name: 'Landscape' } )
			).toBeVisible();
		} );

		it( "keeps the modal's own field when one is registered with its ID", async () => {
			mockRecords( IMAGE_RECORDS );
			renderModal(
				{
					fields: [
						{
							id: 'filename',
							type: 'text',
							label: 'Registered file name',
						} as Field< any >,
					],
				},
				{ type: 'pickerTable', fields: [ 'filename' ] }
			);

			expect(
				await screen.findByRole( 'columnheader', {
					name: /^File name/,
				} )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'columnheader', {
					name: /Registered file name/,
				} )
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
