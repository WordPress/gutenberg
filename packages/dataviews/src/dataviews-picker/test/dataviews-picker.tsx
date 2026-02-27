/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewsPicker from '../index';
import { LAYOUT_PICKER_GRID } from '../../constants';
import type { ActionButton, View, ViewPickerGrid } from '../../types';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';

type Data = {
	id: number;
	title: string;
	author?: number;
	order?: number;
};

const onChangeSelection = jest.fn();

const data: Data[] = [
	{
		id: 1,
		title: 'Hello World',
		author: 1,
		order: 1,
	},
	{
		id: 2,
		title: 'Homepage',
		author: 2,
		order: 1,
	},
	{
		id: 3,
		title: 'Posts',
		author: 2,
		order: 1,
	},
];

const singleSelectCallback = jest.fn();
const singleSelectActions: ActionButton< Data >[] = [
	{
		id: 'confirm',
		label: 'Confirm',
		supportsBulk: false,
		isPrimary: true,
		callback: singleSelectCallback,
	},
];

const multiSelectCallback = jest.fn();
const multiSelectActions: ActionButton< Data >[] = [
	{
		id: 'confirm',
		label: 'Confirm',
		supportsBulk: true,
		isPrimary: true,
		icon: 'check',
		callback: multiSelectCallback,
	},
];

function Picker( {
	view: additionalView,
	actions,
	label,
	multiselect,
	...props
}: {
	actions?: ActionButton< Data >[];
	view?: Partial< View >;
	label?: string;
	multiselect?: boolean;
} ) {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_PICKER_GRID,
		fields: [],
		titleField: 'title',
		mediaField: 'image',
		search: '',
		page: 1,
		perPage: 10,
		filters: [],
		...additionalView,
	} as ViewPickerGrid );

	const [ selection, setSelection ] = useState< string[] >( [] );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, [] );
	}, [ view ] );

	const dataViewProps = {
		actions,
		picker: true,
		getItemId: ( item: Data ) => item.id.toString(),
		paginationInfo,
		data: shownData,
		view,
		defaultLayouts: { [ LAYOUT_PICKER_GRID ]: {} },
		fields: [],
		onChangeView: setView,
		multiselect,
		selection,
		itemListLabel: label,
		onChangeSelection: ( newSelection: string[] ) => {
			onChangeSelection( newSelection );
			setSelection( newSelection );
		},
		...props,
	};

	return <DataViewsPicker { ...dataViewProps } />;
}
describe( 'DataViews Picker', () => {
	describe( 'Grid layout', () => {
		it( 'renders the grid as a `listbox` role, with items as `option` roles', () => {
			render( <Picker /> );

			// Grid should have listbox role
			expect( screen.getByRole( 'listbox' ) ).toBeInTheDocument();

			// Each data item should have option role
			const options = screen.getAllByRole( 'option' );
			expect( options ).toHaveLength( data.length );
		} );

		it( 'supports specifying a `label` which is rendered as an aria-label', () => {
			const testLabel = 'Select an item from the grid';
			render( <Picker label={ testLabel } /> );

			// Grid should have the specified aria-label
			expect(
				screen.getByRole( 'listbox', { name: testLabel } )
			).toBeInTheDocument();
		} );

		it( 'implements single tab-stop composite pattern with aria-activedescendant', async () => {
			render( <Picker /> );

			// Grid should be tabbable as the main composite widget
			const grid = screen.getByRole( 'listbox' );
			expect( grid ).toHaveAttribute( 'tabindex', '0' );

			// Individual options exist but are managed by composite pattern
			const options = screen.getAllByRole( 'option' );
			expect( options.length ).toBeGreaterThan( 0 );

			const user = userEvent.setup();

			const viewOptionsButton = screen.getByRole( 'button', {
				name: 'View options',
			} );

			// Focus the viewOptions button, which is just before the grid.
			viewOptionsButton.focus();
			expect( viewOptionsButton ).toHaveFocus();

			// Tab to the grid (single tab-stop for the entire grid)
			await user.keyboard( '{Tab}' );
			expect( grid ).toHaveFocus();

			// Test aria-activedescendant behavior
			// Trigger navigation to establish aria-activedescendant
			await user.keyboard( '{ArrowRight}' );
			await user.keyboard( '{ArrowLeft}' );
			const firstActiveDescendant = grid.getAttribute(
				'aria-activedescendant'
			);

			expect( firstActiveDescendant ).toBeTruthy();
			expect( firstActiveDescendant ).toBe( options[ 0 ].id );

			// Navigate with arrow keys to test aria-activedescendant changes
			await user.keyboard( '{ArrowRight}' );
			expect( grid ).toHaveFocus();

			// Check that aria-activedescendant changed after navigation
			const secondActiveDescendant = grid.getAttribute(
				'aria-activedescendant'
			);
			expect( secondActiveDescendant ).toBeTruthy();
			expect( secondActiveDescendant ).toBe( options[ 1 ].id );
			expect( secondActiveDescendant ).not.toBe( firstActiveDescendant );

			// Navigate to third option
			await user.keyboard( '{ArrowRight}' );
			expect( grid ).toHaveFocus();

			const thirdActiveDescendant = grid.getAttribute(
				'aria-activedescendant'
			);
			expect( thirdActiveDescendant ).toBeTruthy();
			expect( thirdActiveDescendant ).toBe( options[ 2 ].id );
			expect( thirdActiveDescendant ).not.toBe( firstActiveDescendant );
			expect( thirdActiveDescendant ).not.toBe( secondActiveDescendant );

			// Navigate back to first option
			await user.keyboard( '{ArrowLeft}' );
			expect( grid ).toHaveFocus();

			await user.keyboard( '{ArrowLeft}' );
			expect( grid ).toHaveFocus();

			// Verify aria-activedescendant is back to first option
			const backToFirstActiveDescendant = grid.getAttribute(
				'aria-activedescendant'
			);
			expect( backToFirstActiveDescendant ).toBe( firstActiveDescendant );
			expect( backToFirstActiveDescendant ).toBe( options[ 0 ].id );

			// Tab should move focus away from the grid entirely
			await user.keyboard( '{Tab}' );
			expect( grid ).not.toHaveFocus();

			// Shift+Tab should move back to the grid
			await user.keyboard( '{Shift>}{Tab}{/Shift}' );
			expect( grid ).toHaveFocus();

			// aria-activedescendant should be maintained when returning to grid
			expect( grid.getAttribute( 'aria-activedescendant' ) ).toBeTruthy();
		} );

		describe( 'Single selection', () => {
			it( 'maintains only a single selected item and calls the `onChangeSelection` callback when the selection changes', async () => {
				render( <Picker actions={ singleSelectActions } /> );

				const user = userEvent.setup();
				const listbox = screen.getByRole( 'listbox' );
				const options = within( listbox ).getAllByRole( 'option' );

				// Click first item
				await user.click( options[ 0 ] );
				expect( options[ 0 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);
				expect( options[ 1 ] ).toHaveAttribute(
					'aria-selected',
					'false'
				);
				expect( options[ 2 ] ).toHaveAttribute(
					'aria-selected',
					'false'
				);
				expect( onChangeSelection ).toHaveBeenCalledWith( [
					data[ 0 ].id.toString(),
				] );

				// Click second item - should deselect first
				await user.click( options[ 1 ] );
				expect( options[ 0 ] ).toHaveAttribute(
					'aria-selected',
					'false'
				);
				expect( options[ 1 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);
				expect( options[ 2 ] ).toHaveAttribute(
					'aria-selected',
					'false'
				);
				expect( onChangeSelection ).toHaveBeenCalledWith( [
					data[ 1 ].id.toString(),
				] );
			} );

			it( 'calls the action callback when the action button is clicked', async () => {
				render( <Picker actions={ singleSelectActions } /> );

				const user = userEvent.setup();
				const options = screen.getAllByRole( 'option' );

				// Select first item
				await user.click( options[ 0 ] );
				expect( options[ 0 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);

				// Find the action button with correct label within the action buttons container
				const confirmButton = screen.getByRole( 'button', {
					name: 'Confirm',
				} );
				expect( confirmButton ).toBeInTheDocument();

				// Clear any previous calls and click the action button
				singleSelectCallback.mockClear();
				await user.click( confirmButton );

				// Verify the callback was called with correct parameters
				expect( singleSelectCallback ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		describe( 'Multi selection', () => {
			it( 'adds the `aria-multiselectable` attribute to the listbox', () => {
				render( <Picker actions={ multiSelectActions } /> );

				const listbox = screen.getByRole( 'listbox' );
				expect( listbox ).toHaveAttribute(
					'aria-multiselectable',
					'true'
				);
			} );

			it( 'supports multiple selected items and calls the `onChangeSelection` callback when the selection changes', async () => {
				// Test multi-selection by clicking multiple items
				render( <Picker actions={ multiSelectActions } /> );

				const user = userEvent.setup();
				const listbox = screen.getByRole( 'listbox' );
				const options = within( listbox ).getAllByRole( 'option' );

				// Click first item
				await user.click( options[ 0 ] );
				expect( options[ 0 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);
				expect( options[ 1 ] ).toHaveAttribute(
					'aria-selected',
					'false'
				);
				expect( onChangeSelection ).toHaveBeenCalledWith( [
					data[ 0 ].id.toString(),
				] );

				// Click second item - both should remain selected in multi-select mode
				await user.click( options[ 1 ] );
				expect( options[ 0 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);
				expect( options[ 1 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);
				expect( onChangeSelection ).toHaveBeenCalledWith( [
					data[ 0 ].id.toString(),
					data[ 1 ].id.toString(),
				] );

				// Click first item again to deselect it
				await user.click( options[ 0 ] );
				expect( options[ 0 ] ).toHaveAttribute(
					'aria-selected',
					'false'
				);
				expect( options[ 1 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);
				expect( onChangeSelection ).toHaveBeenCalledWith( [
					data[ 1 ].id.toString(),
				] );
			} );

			it( 'calls the action callback when the action button is clicked', async () => {
				render( <Picker actions={ multiSelectActions } /> );

				const user = userEvent.setup();
				const options = screen.getAllByRole( 'option' );

				// Select multiple items
				await user.click( options[ 0 ] );
				await user.click( options[ 1 ] );

				expect( options[ 0 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);
				expect( options[ 1 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);

				// Third item should remain unselected
				expect( options[ 2 ] ).toHaveAttribute(
					'aria-selected',
					'false'
				);

				// Find the action button with correct label within the action buttons container
				const confirmButton = screen.getByRole( 'button', {
					name: 'Confirm',
				} );
				expect( confirmButton ).toBeInTheDocument();

				// Clear any previous calls and click the action button
				multiSelectCallback.mockClear();
				await user.click( confirmButton );

				// Verify the callback was called with correct parameters for multi-selection
				expect( multiSelectCallback ).toHaveBeenCalledTimes( 1 );
			} );

			it( 'maintains the selected items when navigating between pages for a paginated view', async () => {
				// Create a component with pagination (2 items per page)
				render(
					<Picker
						actions={ multiSelectActions }
						view={ {
							type: LAYOUT_PICKER_GRID,
							fields: [],
							titleField: 'title',
							mediaField: 'image',
							search: '',
							page: 1,
							perPage: 2, // Only 2 items per page to force pagination
							filters: [],
						} }
					/>
				);

				const user = userEvent.setup();
				const listbox = screen.getByRole( 'listbox' );

				// Page 1: Select first item
				let options = within( listbox ).getAllByRole( 'option' );
				expect( options ).toHaveLength( 2 ); // Should show 2 items per page

				await user.click( options[ 0 ] );
				expect( options[ 0 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);
				expect( onChangeSelection ).toHaveBeenCalledWith( [
					data[ 0 ].id.toString(),
				] );

				// Navigate to page 2
				const nextButton = screen.getByRole( 'button', {
					name: /next/i,
				} );
				await user.click( nextButton );

				// Page 2: Select another item
				options = within( listbox ).getAllByRole( 'option' );
				expect( options ).toHaveLength( 1 ); // Page 2 should have 1 item (item 3)

				await user.click( options[ 0 ] );
				expect( options[ 0 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);
				expect( onChangeSelection ).toHaveBeenCalledWith( [
					data[ 0 ].id.toString(),
					data[ 2 ].id.toString(),
				] );

				// Go back to page 1
				const prevButton = screen.getByRole( 'button', {
					name: /previous/i,
				} );
				await user.click( prevButton );

				// Verify first item is still selected
				options = within( listbox ).getAllByRole( 'option' );
				expect( options[ 0 ] ).toHaveAttribute(
					'aria-selected',
					'true'
				);
			} );
		} );
	} );
} );
