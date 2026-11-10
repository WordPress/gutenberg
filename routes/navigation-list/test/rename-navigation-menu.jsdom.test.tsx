import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { Post } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';
import { RenameNavigationMenuModal } from '../actions/rename-navigation-menu';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useDispatch: vi.fn(),
} ) );

vi.mock( import( '@wordpress/core-data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useEntityRecords: vi.fn(),
} ) );

const headerMenu = {
	id: 10,
	type: 'wp_navigation',
	status: 'publish',
	slug: 'header',
	title: { rendered: 'Header Menu' },
} as unknown as Post;

const footerMenu = {
	id: 11,
	type: 'wp_navigation',
	status: 'publish',
	slug: 'footer',
	title: { rendered: 'Footer Menu' },
} as unknown as Post;

let editEntityRecord: Mock;
let saveEditedEntityRecord: Mock;
let createSuccessNotice: Mock;
let createWarningNotice: Mock;
let createErrorNotice: Mock;

function setUpDispatch() {
	editEntityRecord = vi.fn();
	saveEditedEntityRecord = vi.fn();
	createSuccessNotice = vi.fn();
	createWarningNotice = vi.fn();
	createErrorNotice = vi.fn();

	( useDispatch as unknown as Mock ).mockImplementation( () => ( {
		editEntityRecord,
		saveEditedEntityRecord,
		createSuccessNotice,
		createWarningNotice,
		createErrorNotice,
	} ) );
}

// The Save button stays focusable while disabled, so it carries
// `aria-disabled` rather than `disabled`. A notice renders its message both
// in place and in a live region, hence `getAllByText`.
async function renderModal( item: Post = headerMenu ) {
	const user = userEvent.setup();
	const closeModal = vi.fn();

	render(
		<RenameNavigationMenuModal
			items={ [ item ] }
			closeModal={ closeModal }
		/>
	);

	// The slug lives behind a disclosure, as it is not what renaming is for.
	await user.click( screen.getByRole( 'button', { name: 'Advanced' } ) );

	return {
		user,
		closeModal,
		nameInput: screen.getByRole( 'textbox', { name: /Name/ } ),
		slugInput: screen.getByRole( 'textbox', { name: /Slug/ } ),
		saveButton: screen.getByRole( 'button', { name: 'Save' } ),
	};
}

describe( 'RenameNavigationMenuModal', () => {
	beforeEach( () => {
		setUpDispatch();
		( useEntityRecords as unknown as Mock ).mockReturnValue( {
			records: [ headerMenu, footerMenu ],
		} );
	} );

	it( 'cannot be saved before anything is edited', async () => {
		const { saveButton, slugInput } = await renderModal();

		expect( slugInput ).toHaveValue( 'header' );
		expect( saveButton ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'cannot be saved when a percent encoded slug is left alone', async () => {
		// `cleanForSlug()` cannot produce this from the title it came from, so
		// comparing the normalized slug would report an edit nobody made.
		const encodedMenu = {
			...headerMenu,
			slug: '%e4%bd%a0%e5%a5%bd',
		} as unknown as Post;

		const { saveButton } = await renderModal( encodedMenu );

		expect( saveButton ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'saves an edited slug on its own', async () => {
		saveEditedEntityRecord.mockResolvedValue( {
			...headerMenu,
			slug: 'primary',
		} );

		const { user, slugInput, saveButton } = await renderModal();

		await user.clear( slugInput );
		await user.type( slugInput, 'primary' );
		expect( saveButton ).not.toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( saveButton );

		expect( editEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'wp_navigation',
			10,
			{ slug: 'primary' }
		);
		expect( createSuccessNotice ).toHaveBeenCalled();
		expect( createWarningNotice ).not.toHaveBeenCalled();
	} );

	it( 'normalizes a slug as it is stored', async () => {
		saveEditedEntityRecord.mockResolvedValue( {
			...headerMenu,
			slug: 'main-menu',
		} );

		const { user, slugInput, saveButton } = await renderModal();

		await user.clear( slugInput );
		await user.type( slugInput, 'Main Menu' );
		await user.click( saveButton );

		expect( editEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'wp_navigation',
			10,
			{ slug: 'main-menu' }
		);
	} );

	it( 'rejects an emptied slug', async () => {
		const { user, slugInput, saveButton } = await renderModal();

		await user.clear( slugInput );

		expect(
			screen.getAllByText( 'Enter a valid slug.' )[ 0 ]
		).toBeVisible();
		expect( saveButton ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'rejects a slug another menu already uses', async () => {
		const { user, slugInput, saveButton } = await renderModal();

		await user.clear( slugInput );
		await user.type( slugInput, 'footer' );

		expect(
			screen.getAllByText(
				'This slug is already used by another Navigation Menu.'
			)[ 0 ]
		).toBeVisible();
		expect( saveButton ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'does not save a valid slug while the name is emptied', async () => {
		const { user, nameInput, slugInput, saveButton } = await renderModal();

		await user.clear( slugInput );
		await user.type( slugInput, 'primary' );
		await user.clear( nameInput );

		expect( saveButton ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'saves an edited name and slug together', async () => {
		saveEditedEntityRecord.mockResolvedValue( {
			...headerMenu,
			slug: 'primary',
		} );

		const { user, nameInput, slugInput, saveButton } = await renderModal();

		await user.clear( nameInput );
		await user.type( nameInput, 'Primary Menu' );
		await user.clear( slugInput );
		await user.type( slugInput, 'primary' );
		await user.click( saveButton );

		expect( editEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'wp_navigation',
			10,
			{ title: 'Primary Menu', slug: 'primary' }
		);
	} );

	it( 'reports the slug the server stored instead of the requested one', async () => {
		// The uniqueness filter suffixes a slug taken by a menu this modal
		// could not see, which blocks referencing `primary` would not resolve.
		saveEditedEntityRecord.mockResolvedValue( {
			...headerMenu,
			slug: 'primary-2',
		} );

		const { user, slugInput, saveButton } = await renderModal();

		await user.clear( slugInput );
		await user.type( slugInput, 'primary' );
		await user.click( saveButton );

		expect( createWarningNotice ).toHaveBeenCalledWith(
			'That slug was already in use, so this Navigation Menu was saved as "primary-2".',
			{ type: 'snackbar' }
		);
		expect( createSuccessNotice ).not.toHaveBeenCalled();
	} );
} );
