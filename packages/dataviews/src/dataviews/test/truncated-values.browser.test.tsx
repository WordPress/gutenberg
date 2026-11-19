import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@wordpress/theme/design-tokens.css';
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import type { Field, View } from '../../types';
import '../../style.scss';

const initialViewport = {
	width: window.innerWidth,
	height: window.innerHeight,
};
beforeEach( async () => {
	await page.viewport( 1280, 900 );
} );
afterEach( async () => {
	await page.viewport( initialViewport.width, initialViewport.height );
} );

type Item = { id: string; title: string; summary: string; note: string };

const LONG_TEXT = 'A long value that does not fit in its column. '.repeat( 8 );

const data: Item[] = [
	{ id: '1', title: 'First', summary: LONG_TEXT, note: LONG_TEXT },
	{ id: '2', title: 'Second', summary: 'Short', note: 'Short' },
];

const fields: Field< Item >[] = [
	{ id: 'title', label: 'Title', type: 'text' },
	{ id: 'summary', label: 'Summary', type: 'text' },
	{
		id: 'note',
		label: 'Note',
		type: 'text',
		render: ( { item } ) => (
			<span className="custom-note">{ item.note }</span>
		),
	},
];

function renderTable( viewOverrides: Partial< View > = {} ) {
	const view = {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 10,
		layout: {},
		filters: [],
		fields: [ 'title', 'summary' ],
		...viewOverrides,
	} as View;
	return render(
		<DataViews< Item >
			view={ view }
			onChangeView={ () => {} }
			fields={ fields }
			data={ data }
			getItemId={ ( item ) => item.id }
			paginationInfo={ { totalItems: 2, totalPages: 1 } }
			defaultLayouts={ { [ LAYOUT_TABLE ]: true } }
		/>
	);
}

function getCell( row: number, column: number ) {
	return document
		.querySelectorAll< HTMLElement >( '.dataviews-view-table tbody tr' )
		[ row ].querySelectorAll< HTMLElement >( 'td' )[ column ];
}

function getPopover() {
	return document.querySelector( '.dataviews-truncated-value__popover' );
}

describe( 'DataViews table truncated values', () => {
	it( 'cuts a long value to one line inside its column', async () => {
		await renderTable( { fields: [ 'summary', 'title' ] } );

		const value = getCell( 0, 0 ).querySelector< HTMLElement >(
			'.dataviews-truncated-value'
		)!;
		const wrapper = value.closest< HTMLElement >(
			'.dataviews-view-table__cell-content-wrapper'
		)!;

		await expect.poll( () => value.tabIndex ).toBe( 0 );
		expect( value.scrollWidth ).toBeGreaterThan( value.clientWidth );
		// Nothing spills past the cell into the next column.
		expect( wrapper.scrollWidth ).toBe( wrapper.clientWidth );
		expect( value.getBoundingClientRect().right ).toBeLessThanOrEqual(
			getCell( 0, 1 ).getBoundingClientRect().left
		);

		// A value that fits is plain text, not a tab stop.
		expect(
			getCell( 1, 0 ).querySelector( '.dataviews-truncated-value' )
		).not.toHaveAttribute( 'tabindex' );
	} );

	it( 'shows the full value on hover and on focus, and hides it on Escape', async () => {
		await renderTable();
		const user = userEvent.setup();
		const value = getCell( 0, 1 ).querySelector< HTMLElement >(
			'.dataviews-truncated-value'
		)!;
		await expect.poll( () => value.tabIndex ).toBe( 0 );

		await user.hover( value );
		await expect.poll( getPopover ).not.toBeNull();
		expect( getPopover() ).toHaveTextContent( LONG_TEXT.trim() );

		await user.unhover( value );
		await expect.poll( getPopover ).toBeNull();

		value.focus();
		await expect.poll( getPopover ).not.toBeNull();
		// Focus stays on the value.
		expect( value ).toHaveFocus();

		await user.keyboard( '{Escape}' );
		await expect.poll( getPopover ).toBeNull();
	} );

	it( 'leaves values from a field render and the description as they are', async () => {
		await renderTable( {
			fields: [ 'note' ],
			titleField: 'title',
			descriptionField: 'summary',
		} );

		// The field's own render decides how its value fits.
		expect(
			getCell( 0, 1 ).querySelector( '.dataviews-truncated-value' )
		).toBeNull();
		expect(
			getCell( 0, 1 ).querySelector( '.custom-note' )
		).not.toBeNull();

		// The description under the title wraps instead.
		expect(
			getCell( 0, 0 ).querySelector( '.dataviews-truncated-value' )
		).toBeNull();
	} );
} );
