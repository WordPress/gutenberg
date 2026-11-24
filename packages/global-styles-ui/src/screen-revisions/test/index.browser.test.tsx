import { screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Navigator, useNavigator } from '@wordpress/components';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { getGlobalStylesChanges } from '@wordpress/global-styles-engine';
import '@wordpress/dataviews/src/style.scss';
import '@wordpress/components/src/modal/style.scss';
import ScreenRevisions from '../';
import { GlobalStylesContext } from '../../context';
import useGlobalStylesRevisions from '../use-global-styles-revisions';
import type { Revision } from '../types';
import type { GlobalStylesContextType } from '../../context';
import '../style.scss';

vi.mock(
	import( '@wordpress/global-styles-engine' ),
	async ( importOriginal ) => ( {
		...( await importOriginal() ),
		areGlobalStylesEqual: (
			a: Parameters<
				typeof import( '@wordpress/global-styles-engine' ).areGlobalStylesEqual
			>[ 0 ],
			b: Parameters<
				typeof import( '@wordpress/global-styles-engine' ).areGlobalStylesEqual
			>[ 1 ]
		) =>
			JSON.stringify( { styles: a?.styles, settings: a?.settings } ) ===
			JSON.stringify( { styles: b?.styles, settings: b?.settings } ),
		getGlobalStylesChanges: vi.fn( () => [ 'Colors styles.' ] ),
	} )
);

vi.mock( import( '../use-global-styles-revisions' ), () => ( {
	default: vi.fn(),
} ) );

const STYLES_A = { color: { background: '#fff' } };
const STYLES_B = { color: { background: '#111' } };
const STYLES_C = { color: { background: '#222' } };

const REVISIONS: Revision[] = [
	{
		id: 'unsaved',
		styles: STYLES_A,
		settings: {},
		modified: new Date( '2026-07-07T12:30:00' ),
	},
	{
		id: 10,
		styles: STYLES_B,
		settings: {},
		author: {
			id: 1,
			name: 'Alice',
			avatar_urls: {
				48: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
			},
		},
		modified: '2026-07-07T12:00:00',
	},
	{
		id: 9,
		styles: STYLES_C,
		settings: {},
		author: {
			id: 2,
			name: 'Bob',
			avatar_urls: {
				48: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
			},
		},
		modified: '2026-07-07T11:00:00',
	},
	{ id: 'parent', styles: {}, settings: {} },
];

// The second page of an older set: it carries neither the unsaved entry nor
// revision 10.
const OLDER_REVISIONS: Revision[] = [
	{
		id: 8,
		styles: STYLES_C,
		settings: {},
		author: {
			id: 2,
			name: 'Bob',
			avatar_urls: {
				48: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
			},
		},
		modified: '2026-07-06T11:00:00',
	},
	{ id: 'parent', styles: {}, settings: {} },
];

const mockedRevisions = vi.mocked( useGlobalStylesRevisions );

function CurrentPath() {
	const { location } = useNavigator();
	return <output aria-label="Current path">{ location.path }</output>;
}

async function renderScreen( {
	userConfig = { styles: STYLES_A, settings: {} },
	revisionId,
}: {
	userConfig?: GlobalStylesContextType[ 'user' ];
	revisionId?: string;
} = {} ) {
	const onChange = vi.fn();
	const registry = createRegistry();
	registry.register( coreStore );
	const coreActions = registry.dispatch( coreStore );
	coreActions.receiveCurrentUser( {
		id: 3,
		name: 'admin',
		slug: 'admin',
		url: '',
		description: '',
		link: '',
		meta: {},
		avatar_urls: {
			24: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
			48: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
			96: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
		},
	} );
	coreActions.finishResolution( 'getCurrentUser', [] );
	coreActions.receiveCurrentTheme( { stylesheet: 'test-theme' } );
	await coreActions.receiveEntityRecords( 'root', 'theme', [
		{ stylesheet: 'test-theme', name: { rendered: 'Test Theme' } },
	] );
	coreActions.finishResolution( 'getCurrentTheme', [] );
	const tree = () => (
		<RegistryProvider value={ registry }>
			<GlobalStylesContext.Provider
				value={ { user: userConfig, base: {}, merged: {}, onChange } }
			>
				<Navigator
					initialPath={
						revisionId ? `/revisions/${ revisionId }` : '/revisions'
					}
				>
					<CurrentPath />
					<Navigator.Screen path="/">
						<h2>Styles</h2>
					</Navigator.Screen>
					<Navigator.Screen path="/revisions/:revisionId?">
						<ScreenRevisions />
					</Navigator.Screen>
				</Navigator>
			</GlobalStylesContext.Provider>
		</RegistryProvider>
	);
	const view = await render( tree() );
	return { onChange, rerender: () => view.rerender( tree() ) };
}

describe( 'ScreenRevisions', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		mockedRevisions.mockReturnValue( {
			revisions: REVISIONS,
			isLoading: false,
			hasUnsavedChanges: false,
			revisionsCount: 12,
		} );
	} );

	it( 'renders the expected label for every revision kind', async () => {
		await renderScreen();

		const options = screen.getAllByRole( 'option' );
		expect( options ).toHaveLength( 4 );
		expect( options[ 0 ] ).toHaveAccessibleName(
			'Unsaved changes by admin'
		);
		expect( options[ 1 ] ).toHaveAccessibleName(
			/^Changes saved by Alice on /
		);
		expect( options[ 2 ] ).toHaveAccessibleName(
			/^Changes saved by Bob on /
		);
		expect( options[ 3 ] ).toHaveAccessibleName(
			'Reset the styles to the theme defaults'
		);

		expect(
			screen.getByLabelText( 'Global styles revisions list' )
		).toBeVisible();
		// The reset entry shows the theme name in the meta slot; the others
		// show the author avatar and name.
		expect( screen.getByText( 'Test Theme' ) ).toBeVisible();
		expect( screen.getByAltText( 'Alice' ) ).toBeVisible();
		expect( screen.getByAltText( 'Bob' ) ).toBeVisible();
	} );

	it( 'marks the default selection as active when it matches the editor styles', async () => {
		const { onChange } = await renderScreen();

		// No route param selects the first revision (the unsaved one), whose
		// styles match the editor styles.
		const selected = screen.getAllByRole( 'option' )[ 0 ];
		expect( selected ).toHaveAttribute( 'aria-selected', 'true' );
		expect( within( selected ).getByText( 'Active' ) ).toBeVisible();
		// The footer action is not applicable to the active revision.
		const apply = page.getByRole( 'button', { name: 'Apply' } );
		await expect
			.element( apply )
			.toHaveAttribute( 'aria-disabled', 'true' );
		apply.element().focus();
		await userEvent.keyboard( '{Enter}' );
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'marks the latest revision as active by id when nothing is unsaved', async () => {
		// Saved revisions only, and the latest one carries a payload the editor
		// styles do not compare equal to, as happens when the revisions and the
		// global styles endpoints serialize the same styles differently.
		mockedRevisions.mockReturnValue( {
			revisions: REVISIONS.slice( 1 ),
			isLoading: false,
			hasUnsavedChanges: false,
			revisionsCount: 12,
		} );

		const { onChange } = await renderScreen( {
			userConfig: { styles: STYLES_A, settings: {} },
		} );

		const latest = screen.getAllByRole( 'option' )[ 0 ];
		expect( latest ).toHaveAttribute( 'aria-selected', 'true' );
		expect( latest ).toHaveAccessibleName(
			/This revision matches current editor styles\.$/
		);
		expect( within( latest ).getByText( 'Active' ) ).toBeVisible();
		const apply = page.getByRole( 'button', { name: 'Apply' } );
		await expect
			.element( apply )
			.toHaveAttribute( 'aria-disabled', 'true' );
		apply.element().focus();
		await userEvent.keyboard( '{Enter}' );
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'appends the matching-styles hint to the selected revision label', async () => {
		const revisionId = '10';

		await renderScreen( {
			revisionId,
			userConfig: { styles: STYLES_B, settings: {} },
		} );

		expect( screen.getAllByRole( 'option' )[ 1 ] ).toHaveAccessibleName(
			/^Changes saved by Alice on .* This revision matches current editor styles\.$/
		);
	} );

	it( 'shows the changes summary for the selected revision and applies it from the footer', async () => {
		const revisionId = '9';

		const { onChange } = await renderScreen( {
			revisionId,
			userConfig: { styles: STYLES_B, settings: {} },
		} );

		const selected = screen.getAllByRole( 'option' )[ 2 ];
		expect( selected ).toHaveAttribute( 'aria-selected', 'true' );

		// The changes summary renders once, inside the selected option, and
		// diffs the selected revision against the next one in the list.
		const changes = screen.getAllByTestId(
			'global-styles-revision-changes'
		);
		expect( changes ).toHaveLength( 1 );
		expect( selected ).toContainElement( changes[ 0 ] );
		expect( getGlobalStylesChanges ).toHaveBeenCalledWith(
			REVISIONS[ 2 ],
			REVISIONS[ 3 ],
			{ maxResults: 7 }
		);

		// Options hold no interactive content; the action lives in the
		// footer, outside the listbox options.
		expect(
			within( selected ).queryByRole( 'button' )
		).not.toBeInTheDocument();

		const applyButton = screen.getByRole( 'button', { name: 'Apply' } );
		expect( applyButton ).toBeEnabled();
		await userEvent.click( applyButton );
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { id: 9 } )
		);
	} );

	it( 'labels the footer action for the reset entry', async () => {
		const revisionId = 'parent';

		const { onChange } = await renderScreen( {
			revisionId,
			userConfig: { styles: STYLES_B, settings: {} },
		} );

		const reset = page.getByRole( 'button', { name: 'Reset' } );
		await expect
			.element( reset )
			.not.toHaveAttribute( 'aria-disabled', 'true' );
		await userEvent.click( reset );
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { id: 'parent' } )
		);
	} );

	it( 'asks for confirmation before applying over unsaved changes', async () => {
		const revisionId = '9';
		mockedRevisions.mockReturnValue( {
			revisions: REVISIONS,
			isLoading: false,
			hasUnsavedChanges: true,
			revisionsCount: 12,
		} );

		const { onChange } = await renderScreen( {
			revisionId,
			userConfig: { styles: STYLES_B, settings: {} },
		} );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Apply' } )
		);
		const dialog = screen.getByRole( 'dialog' );
		expect( dialog ).toHaveTextContent(
			'Are you sure you want to apply this revision? Any unsaved changes will be lost.'
		);
		expect( onChange ).not.toHaveBeenCalled();

		await userEvent.click(
			within( dialog ).getByRole( 'button', { name: 'Apply' } )
		);
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { id: 9 } )
		);
	} );

	it( 'closes the confirmation without applying when the selected revision is gone', async () => {
		const revisionId = '9';
		mockedRevisions.mockReturnValue( {
			revisions: REVISIONS,
			isLoading: false,
			hasUnsavedChanges: true,
			revisionsCount: 12,
		} );

		const { onChange, rerender } = await renderScreen( {
			revisionId,
			userConfig: { styles: STYLES_B, settings: {} },
		} );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Apply' } )
		);
		const dialog = screen.getByRole( 'dialog' );

		// The fetched page changes while confirmation is open.
		mockedRevisions.mockReturnValue( {
			revisions: OLDER_REVISIONS,
			isLoading: false,
			hasUnsavedChanges: true,
			revisionsCount: 12,
		} );
		await rerender();

		await userEvent.click(
			within( dialog ).getByRole( 'button', { name: 'Apply' } )
		);
		expect( onChange ).not.toHaveBeenCalled();
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'navigates to the clicked revision and ignores empty selections', async () => {
		await renderScreen();

		await userEvent.click(
			screen.getByRole( 'option', {
				name: /^Changes saved by Alice on /,
			} )
		);
		await expect
			.element( page.getByRole( 'status', { name: 'Current path' } ) )
			.toHaveTextContent( /^\/revisions\/10$/ );
		expect(
			screen.getByRole( 'option', {
				name: /^Changes saved by Alice on /,
			} )
		).toHaveAttribute( 'aria-selected', 'true' );

		await userEvent.click(
			screen.getByRole( 'option', {
				name: /^Changes saved by Alice on /,
			} )
		);
		await expect
			.element( page.getByRole( 'status', { name: 'Current path' } ) )
			.toHaveTextContent( /^\/revisions\/10$/ );
		expect(
			screen.getByRole( 'option', {
				name: /^Changes saved by Alice on /,
			} )
		).toHaveAttribute( 'aria-selected', 'true' );
	} );

	it( 'selects nothing when the revision in the path is on another page', async () => {
		const revisionId = '10';
		mockedRevisions.mockImplementation( ( { query } = {} ) => ( {
			revisions: query?.page === 1 ? REVISIONS : OLDER_REVISIONS,
			isLoading: false,
			hasUnsavedChanges: false,
			revisionsCount: 12,
		} ) );

		const { onChange } = await renderScreen( {
			revisionId,
			userConfig: { styles: STYLES_A, settings: {} },
		} );

		expect( useGlobalStylesRevisions ).toHaveBeenLastCalledWith( {
			query: { per_page: 10, page: 1 },
		} );
		expect( screen.getAllByRole( 'option' )[ 1 ] ).toHaveAttribute(
			'aria-selected',
			'true'
		);

		await userEvent.click(
			page.getByRole( 'combobox', { name: 'Current page' } )
		);
		await userEvent.click(
			page.getByRole( 'option', { name: '2', exact: true } )
		);
		expect( useGlobalStylesRevisions ).toHaveBeenLastCalledWith( {
			query: { per_page: 10, page: 2 },
		} );

		// Revision 10 is not on this page, so nothing here is selected, no
		// option claims to hold the editor styles, and there is nothing to
		// apply from it.
		screen.getAllByRole( 'option' ).forEach( ( option ) => {
			expect( option ).toHaveAttribute( 'aria-selected', 'false' );
		} );
		expect( screen.queryByText( 'Active' ) ).not.toBeInTheDocument();
		const apply = page.getByRole( 'button', { name: 'Apply' } );
		await expect
			.element( apply )
			.toHaveAttribute( 'aria-disabled', 'true' );
		apply.element().focus();
		await userEvent.keyboard( '{Enter}' );
		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
