import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DataViews from '../../../dataviews';
import type { View } from '../../../types';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockCSSSupports();
globalThis.wpVitest.mockResizeObserver();

const toLocaleString = Number.prototype.toLocaleString;
const fields = [ { id: 'title', label: 'Title', type: 'text' as const } ];
const view: View = {
	type: 'table',
	page: 1234,
	perPage: 10,
	titleField: 'title',
	fields: [],
	sort: { field: 'title', direction: 'asc' },
};

function renderControls( locale: string, config = false ) {
	vi.spyOn( Number.prototype, 'toLocaleString' ).mockImplementation(
		function ( this: number ) {
			return toLocaleString.call( this, locale );
		}
	);
	const onChangeView = vi.fn();
	render(
		<DataViews
			data={ [ { id: '1', title: 'Example' } ] }
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
			getItemId={ ( item ) => item.id }
			paginationInfo={ { totalItems: 12350, totalPages: 1235 } }
			defaultLayouts={ { table: {} } }
			config={ { perPageSizes: [ 1000, 2500 ] } }
		>
			{ config ? <DataViews.ViewConfig /> : <DataViews.Pagination /> }
		</DataViews>
	);
	return { onChangeView };
}

afterEach( () => vi.restoreAllMocks() );

describe( 'DataViews page controls', () => {
	it.each( [
		[ 'en-US', '1,234', '1,235', '1,000' ],
		[ 'de-DE', '1.234', '1.235', '1.000' ],
	] )( 'formats page labels using %s', ( locale, current, total, option ) => {
		renderControls( locale );
		expect( screen.getByText( `of ${ total }` ) ).toBeVisible();
		expect(
			screen.getByRole( 'option', {
				name: `Page ${ current } of ${ total }`,
			} )
		).toHaveTextContent( current );
		expect( screen.getByRole( 'option', { name: option } ) ).toHaveValue(
			'1000'
		);
	} );

	it( 'keeps page changes numeric when option labels are formatted', async () => {
		const user = userEvent.setup();
		const { onChangeView } = renderControls( 'en-US' );
		await user.selectOptions(
			screen.getByRole( 'combobox', { name: 'Current page' } ),
			'1000'
		);
		expect( onChangeView ).toHaveBeenCalledWith( { ...view, page: 1000 } );
	} );

	it( 'keeps page-size changes numeric when labels are formatted', async () => {
		const user = userEvent.setup();
		const { onChangeView } = renderControls( 'en-US', true );
		await user.click(
			screen.getByRole( 'button', { name: 'View options' } )
		);
		await user.click( screen.getByRole( 'radio', { name: '2,500' } ) );
		expect( onChangeView ).toHaveBeenCalledWith( {
			...view,
			perPage: 2500,
			page: 1,
		} );
	} );
} );
