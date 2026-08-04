/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useNavigator } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { getGlobalStylesChanges } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import ScreenRevisions from '../';
import { GlobalStylesContext } from '../../context';
import useGlobalStylesRevisions from '../use-global-styles-revisions';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

jest.mock( '@wordpress/components', () => ( {
	...jest.requireActual( '@wordpress/components' ),
	useNavigator: jest.fn(),
} ) );

jest.mock( '@wordpress/global-styles-engine', () => ( {
	...jest.requireActual( '@wordpress/global-styles-engine' ),
	areGlobalStylesEqual: ( a, b ) =>
		JSON.stringify( { styles: a?.styles, settings: a?.settings } ) ===
		JSON.stringify( { styles: b?.styles, settings: b?.settings } ),
	getGlobalStylesChanges: jest.fn( () => [ 'Colors styles.' ] ),
} ) );

jest.mock( '../use-global-styles-revisions', () => jest.fn() );

jest.mock( '../../screen-header', () => ( {
	ScreenHeader: ( { title, description } ) => (
		<div>
			<h2>{ title }</h2>
			<p>{ description }</p>
		</div>
	),
} ) );

jest.mock( '../../lock-unlock', () => ( {
	unlock: () => ( {
		Badge: ( { children, className } ) => (
			<span className={ className }>{ children }</span>
		),
	} ),
} ) );

jest.mock( '@wordpress/dataviews', () => {
	const DataViewsPicker = ( {
		data,
		fields,
		getItemId,
		selection,
		onChangeSelection,
		view,
		onChangeView,
		itemListLabel,
		actions = [],
	} ) => {
		const titleField = fields.find( ( f ) => f.id === view.titleField );
		const descriptionField = fields.find(
			( f ) => f.id === view.descriptionField
		);
		const selectedItems = data.filter( ( item ) =>
			selection.includes( getItemId( item ) )
		);

		return (
			<div role="listbox" aria-label={ itemListLabel }>
				{ data.map( ( item ) => (
					<div
						key={ getItemId( item ) }
						role="option"
						aria-label={ titleField.getValue( { item } ) }
						aria-selected={ selection.includes(
							getItemId( item )
						) }
						onClick={ () =>
							onChangeSelection( [ getItemId( item ) ] )
						}
						onKeyDown={ () => {} }
						tabIndex={ -1 }
					>
						<titleField.render item={ item } field={ titleField } />
						<descriptionField.render
							item={ item }
							field={ descriptionField }
						/>
					</div>
				) ) }
				<button onClick={ () => onChangeSelection( [] ) }>
					Clear selection
				</button>
				<button
					onClick={ () =>
						onChangeView( {
							...view,
							page: ( view.page ?? 1 ) + 1,
						} )
					}
				>
					Next page
				</button>
				{ /* Mirrors the picker footer's action buttons: eligibility
				     disables the button, the label sees the selection, the
				     callback only receives eligible items. */ }
				{ actions.map( ( action ) => {
					const eligibleItems = action.isEligible
						? selectedItems.filter( action.isEligible )
						: selectedItems;
					return (
						<button
							key={ action.id }
							disabled={
								! selection.length || ! eligibleItems.length
							}
							onClick={ () => action.callback( eligibleItems ) }
						>
							{ typeof action.label === 'string'
								? action.label
								: action.label( selectedItems ) }
						</button>
					);
				} ) }
			</div>
		);
	};
	DataViewsPicker.Layout = () => null;
	DataViewsPicker.Footer = () => null;

	return { DataViewsPicker };
} );

const STYLES_A = { color: { background: '#fff' } };
const STYLES_B = { color: { background: '#111' } };
const STYLES_C = { color: { background: '#222' } };

const REVISIONS = [
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
		author: { name: 'Alice', avatar_urls: { 48: 'http://alice.avatar' } },
		modified: '2026-07-07T12:00:00',
	},
	{
		id: 9,
		styles: STYLES_C,
		settings: {},
		author: { name: 'Bob', avatar_urls: { 48: 'http://bob.avatar' } },
		modified: '2026-07-07T11:00:00',
	},
	{ id: 'parent', styles: {}, settings: {} },
];

function renderScreen( {
	userConfig = { styles: STYLES_A, settings: {} },
} = {} ) {
	const onChange = jest.fn();
	render(
		<GlobalStylesContext.Provider
			value={ { user: userConfig, base: {}, merged: {}, onChange } }
		>
			<ScreenRevisions />
		</GlobalStylesContext.Provider>
	);
	return { onChange };
}

describe( 'ScreenRevisions', () => {
	let goTo;

	beforeEach( () => {
		jest.clearAllMocks();
		goTo = jest.fn();
		useNavigator.mockReturnValue( { params: {}, goTo } );
		useGlobalStylesRevisions.mockReturnValue( {
			revisions: REVISIONS,
			isLoading: false,
			hasUnsavedChanges: false,
			revisionsCount: 12,
		} );
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getCurrentTheme: () => ( {
					name: { rendered: 'Test Theme' },
				} ),
				getCurrentUser: () => ( {
					name: 'admin',
					avatar_urls: { 48: 'http://admin.avatar' },
				} ),
			} ) )
		);
	} );

	it( 'renders the expected label for every revision kind', () => {
		renderScreen();

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

	it( 'marks the default selection as active when it matches the editor styles', () => {
		renderScreen();

		// No route param selects the first revision (the unsaved one), whose
		// styles match the editor styles.
		const selected = screen.getAllByRole( 'option' )[ 0 ];
		expect( selected ).toHaveAttribute( 'aria-selected', 'true' );
		expect( within( selected ).getByText( 'Active' ) ).toBeVisible();
		// The footer action is not applicable to the active revision.
		expect(
			screen.getByRole( 'button', { name: 'Apply' } )
		).toBeDisabled();
	} );

	it( 'appends the matching-styles hint to the selected revision label', () => {
		useNavigator.mockReturnValue( { params: { revisionId: '10' }, goTo } );

		renderScreen( { userConfig: { styles: STYLES_B, settings: {} } } );

		expect( screen.getAllByRole( 'option' )[ 1 ] ).toHaveAccessibleName(
			/^Changes saved by Alice on .* This revision matches current editor styles\.$/
		);
	} );

	it( 'shows the changes summary for the selected revision and applies it from the footer', async () => {
		useNavigator.mockReturnValue( { params: { revisionId: '9' }, goTo } );

		const { onChange } = renderScreen( {
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

	it( 'labels the footer action for the reset entry', () => {
		useNavigator.mockReturnValue( {
			params: { revisionId: 'parent' },
			goTo,
		} );

		renderScreen( { userConfig: { styles: STYLES_B, settings: {} } } );

		expect( screen.getByRole( 'button', { name: 'Reset' } ) ).toBeEnabled();
	} );

	it( 'asks for confirmation before applying over unsaved changes', async () => {
		useNavigator.mockReturnValue( { params: { revisionId: '9' }, goTo } );
		useGlobalStylesRevisions.mockReturnValue( {
			revisions: REVISIONS,
			isLoading: false,
			hasUnsavedChanges: true,
			revisionsCount: 12,
		} );

		const { onChange } = renderScreen( {
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

	it( 'navigates to the clicked revision and ignores empty selections', async () => {
		renderScreen();

		await userEvent.click(
			screen.getByRole( 'option', {
				name: /^Changes saved by Alice on /,
			} )
		);
		expect( goTo ).toHaveBeenCalledWith( '/revisions/10' );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Clear selection' } )
		);
		expect( goTo ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'queries the revisions page driven by the view', async () => {
		renderScreen();

		expect( useGlobalStylesRevisions ).toHaveBeenLastCalledWith( {
			query: { per_page: 10, page: 1 },
		} );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Next page' } )
		);
		expect( useGlobalStylesRevisions ).toHaveBeenLastCalledWith( {
			query: { per_page: 10, page: 2 },
		} );
	} );
} );
