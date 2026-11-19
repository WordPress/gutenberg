import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useMemo, useState } from '@wordpress/element';
import DataViewsPicker from '../index';
import { LAYOUT_PICKER_GRID, LAYOUT_PICKER_TABLE } from '../../constants';
import { SELECTION_CHECKBOX_CLASS } from '../../components/dataviews-selection-checkbox';
import type { ActionButton, Field, SupportedLayouts, View } from '../../types';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockPointerEvent();
globalThis.wpVitest.mockCSSSupports();

// jsdom has no layout APIs; the picker layouts observe their containers.
( globalThis as any ).ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
};
( globalThis as any ).IntersectionObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
	takeRecords() {
		return [];
	}
};

type Data = {
	id: number;
	title: string;
};

const data: Data[] = [
	{ id: 1, title: 'Hello World' },
	{ id: 2, title: 'Homepage' },
	{ id: 3, title: 'Posts' },
];

const fields: Field< Data >[] = [
	{ id: 'title', label: 'Title', type: 'text' },
];

const mediaFields: Field< Data >[] = [
	...fields,
	{
		id: 'image',
		label: 'Image',
		type: 'media',
		render: () => <img alt="" />,
	},
];

const singleSelectActions: ActionButton< Data >[] = [
	{
		id: 'confirm',
		label: 'Confirm…',
		supportsBulk: false,
		isPrimary: true,
		callback: vi.fn(),
	},
];

const multiSelectActions: ActionButton< Data >[] = [
	{
		id: 'confirm',
		label: 'Confirm',
		supportsBulk: true,
		isPrimary: true,
		icon: 'check',
		callback: vi.fn(),
	},
];

function Picker( {
	actions = singleSelectActions,
	isItemSelectable,
	layout = LAYOUT_PICKER_TABLE,
	pickerFields = fields,
	onChangeSelection,
}: {
	actions?: ActionButton< Data >[];
	isItemSelectable?: ( item: Data ) => boolean;
	layout?: typeof LAYOUT_PICKER_TABLE | typeof LAYOUT_PICKER_GRID;
	pickerFields?: Field< Data >[];
	onChangeSelection?: ( selection: string[] ) => void;
} ) {
	const [ view, setView ] = useState< View >( {
		type: layout,
		fields: [ 'title' ],
		titleField: 'title',
		mediaField: 'image',
		search: '',
		page: 1,
		perPage: 10,
		filters: [],
	} as View );
	const [ selection, setSelection ] = useState< string[] >( [] );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, pickerFields );
	}, [ view, pickerFields ] );

	return (
		<DataViewsPicker
			actions={ actions }
			getItemId={ ( item: Data ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			defaultLayouts={ { [ layout ]: true } as SupportedLayouts }
			fields={ pickerFields }
			onChangeView={ setView }
			selection={ selection }
			onChangeSelection={ ( newSelection: string[] ) => {
				setSelection( newSelection );
				onChangeSelection?.( newSelection );
			} }
			isItemSelectable={ isItemSelectable }
		/>
	);
}

// The picker's `Composite` schedules state updates on mount, so each render is
// flushed afterwards to keep the console clean.
async function renderPicker( ui: React.ReactElement ) {
	render( ui );
	await act( async () => {
		await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );
	} );
}

// Each row's indicator carries `SELECTION_CHECKBOX_CLASS`; querying it directly
// is how the rendered control per row is asserted.
function getSelectionIndicators() {
	return Array.from(
		document.querySelectorAll( `.${ SELECTION_CHECKBOX_CLASS }` )
	);
}

// A multi-selection indicator is itself a checkbox, while a single-selection
// indicator is a radiogroup wrapping the radio.
function hasRole( element: Element, role: string ) {
	return (
		element.matches( `[role="${ role }"]` ) ||
		!! element.querySelector( `[role="${ role }"]` )
	);
}

describe( 'DataViewsPicker selection control', () => {
	it( 'renders a radio button for every row in single selection', async () => {
		await renderPicker( <Picker actions={ singleSelectActions } /> );

		const indicators = getSelectionIndicators();
		expect( indicators ).toHaveLength( data.length );
		for ( const indicator of indicators ) {
			expect( hasRole( indicator, 'radio' ) ).toBe( true );
			expect( hasRole( indicator, 'checkbox' ) ).toBe( false );
		}
	} );

	it( 'renders a radio button for every grid card in single selection', async () => {
		await renderPicker(
			<Picker
				actions={ singleSelectActions }
				layout={ LAYOUT_PICKER_GRID }
				pickerFields={ mediaFields }
			/>
		);

		const indicators = getSelectionIndicators();
		expect( indicators ).toHaveLength( data.length );
		for ( const indicator of indicators ) {
			expect( hasRole( indicator, 'radio' ) ).toBe( true );
			expect( hasRole( indicator, 'checkbox' ) ).toBe( false );
		}
	} );

	it( 'renders a checkbox for every row in multi selection', async () => {
		await renderPicker( <Picker actions={ multiSelectActions } /> );

		const indicators = getSelectionIndicators();
		expect( indicators ).toHaveLength( data.length );
		for ( const indicator of indicators ) {
			expect( hasRole( indicator, 'checkbox' ) ).toBe( true );
			expect( hasRole( indicator, 'radio' ) ).toBe( false );
		}
	} );

	it( 'marks a non-selectable item as disabled and ignores row clicks', async () => {
		const onChangeSelection = vi.fn();
		await renderPicker(
			<Picker
				actions={ singleSelectActions }
				isItemSelectable={ ( item ) => item.id !== 2 }
				onChangeSelection={ onChangeSelection }
			/>
		);

		const indicators = getSelectionIndicators();
		// eslint-disable-next-line testing-library/no-node-access
		const disabledRadio = indicators[ 1 ].querySelector(
			'[role="radio"]'
		) as HTMLElement;
		expect( disabledRadio ).toHaveAttribute( 'aria-disabled', 'true' );

		const options = within( screen.getByRole( 'listbox' ) ).getAllByRole(
			'option'
		);
		// `fireEvent` avoids the Composite focus side effect that jsdom warns
		// about.
		fireEvent.click( options[ 1 ] );
		expect( onChangeSelection ).not.toHaveBeenCalled();

		fireEvent.click( options[ 0 ] );
		expect( onChangeSelection ).toHaveBeenCalledWith( [ '1' ] );
	} );

	it( 'excludes non-selectable items from select all', async () => {
		const onChangeSelection = vi.fn();
		const user = userEvent.setup();
		await renderPicker(
			<Picker
				actions={ multiSelectActions }
				isItemSelectable={ ( item ) => item.id !== 2 }
				onChangeSelection={ onChangeSelection }
			/>
		);

		await user.click(
			within( screen.getByRole( 'listbox' ) ).getByRole( 'checkbox', {
				name: 'Select all',
			} )
		);

		expect( onChangeSelection ).toHaveBeenCalledWith( [ '1', '3' ] );
	} );
} );
