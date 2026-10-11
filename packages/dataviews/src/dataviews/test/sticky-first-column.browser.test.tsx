import { waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import type { Action, View } from '../../types';

type Data = {
	id: number;
	title: string;
};

const LONG_VALUE = 'A value long enough to make the table scroll horizontally';

function makeFields() {
	return [
		{
			id: 'title',
			label: 'Title',
			type: 'text' as const,
		},
		...Array.from( { length: 12 }, ( _, index ) => ( {
			id: `metric-${ index }`,
			label: `Metric ${ index }`,
			type: 'text' as const,
			getValue: () => LONG_VALUE,
		} ) ),
	];
}

const data: Data[] = Array.from( { length: 5 }, ( _, index ) => ( {
	id: index + 1,
	title: `Item ${ index + 1 }`,
} ) );

const actions: Action< Data >[] = [
	{
		id: 'delete',
		label: 'Delete',
		supportsBulk: true,
		callback: () => {},
	},
];

function viewWith( stickyFirstColumn: boolean ): View {
	return {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 10,
		layout: { stickyFirstColumn },
		filters: [],
		fields: [
			'title',
			...Array.from(
				{ length: 12 },
				( _, index ) => `metric-${ index }`
			),
		],
		titleField: 'title',
	};
}

async function renderTable( {
	stickyFirstColumn,
	actions: tableActions = [],
}: {
	stickyFirstColumn: boolean;
	actions?: Action< Data >[];
} ) {
	const result = await render(
		<div style={ { width: 500 } }>
			<DataViews< Data >
				view={ viewWith( stickyFirstColumn ) }
				onChangeView={ () => {} }
				fields={ makeFields() }
				data={ data }
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ { totalItems: data.length, totalPages: 1 } }
				defaultLayouts={ { [ LAYOUT_TABLE ]: true } }
				actions={ tableActions }
			/>
		</div>
	);

	// The production scroll listener is attached to this internal container.
	// eslint-disable-next-line testing-library/no-node-access
	const layoutContainer = result.container.querySelector(
		'.dataviews-layout__container'
	) as HTMLDivElement;
	// The test stylesheet isn't loaded, so make the container itself scroll
	// horizontally the way the production stylesheet would.
	Object.assign( layoutContainer.style, { overflowX: 'auto' } );

	return { ...result, layoutContainer };
}

function getPrimaryHeaders( container: HTMLElement ) {
	return container.querySelectorAll< HTMLTableCellElement >(
		'.dataviews-view-table__primary-column--sticky'
	);
}

function getTable( container: HTMLElement ) {
	return container.querySelector( '.dataviews-view-table' );
}

describe( 'DataViews sticky first column', () => {
	it( 'marks the table and its cells only when the view opts in', async () => {
		const optedIn = await renderTable( { stickyFirstColumn: true } );

		expect( getTable( optedIn.container ) ).toHaveClass(
			'has-sticky-first-column'
		);
		// The header plus one per rendered row.
		expect( getPrimaryHeaders( optedIn.container ) ).toHaveLength(
			data.length + 1
		);

		const optedOut = await renderTable( { stickyFirstColumn: false } );

		expect( getTable( optedOut.container ) ).not.toHaveClass(
			'has-sticky-first-column'
		);
		expect( getPrimaryHeaders( optedOut.container ) ).toHaveLength( 0 );
	} );

	it( 'toggles the stuck state as the table scrolls away from the start', async () => {
		const { container, layoutContainer } = await renderTable( {
			stickyFirstColumn: true,
		} );

		await waitFor( () => {
			expect( layoutContainer.scrollWidth ).toBeGreaterThan(
				layoutContainer.clientWidth
			);
		} );

		const [ header ] = getPrimaryHeaders( container );
		expect( header ).not.toHaveClass(
			'dataviews-view-table__primary-column--stuck'
		);

		layoutContainer.scrollLeft = 300;

		await waitFor( () => {
			expect( header ).toHaveClass(
				'dataviews-view-table__primary-column--stuck'
			);
		} );

		layoutContainer.scrollLeft = 0;

		await waitFor( () => {
			expect( header ).not.toHaveClass(
				'dataviews-view-table__primary-column--stuck'
			);
		} );
	} );

	it( 'offsets the sticky column by the measured checkbox width with bulk actions', async () => {
		const { container, layoutContainer } = await renderTable( {
			stickyFirstColumn: true,
			actions,
		} );

		await waitFor( () => {
			expect( layoutContainer.scrollWidth ).toBeGreaterThan(
				layoutContainer.clientWidth
			);
		} );

		// eslint-disable-next-line testing-library/no-node-access
		const table = container.querySelector( '.dataviews-view-table' )!;
		// eslint-disable-next-line testing-library/no-node-access
		const checkbox = container.querySelector(
			'th.dataviews-view-table__checkbox-column--sticky'
		) as HTMLTableCellElement;
		expect( checkbox ).not.toBeNull();

		await waitFor( () => {
			const offset = parseFloat(
				getComputedStyle( table ).getPropertyValue(
					'--wp-dataviews-first-column-offset'
				)
			);
			expect( offset ).toBeCloseTo(
				checkbox.getBoundingClientRect().width,
				0
			);
		} );
	} );

	it( 'leaves the offset at zero without bulk actions', async () => {
		const { container } = await renderTable( {
			stickyFirstColumn: true,
		} );

		// eslint-disable-next-line testing-library/no-node-access
		const table = container.querySelector( '.dataviews-view-table' )!;
		expect(
			getComputedStyle( table ).getPropertyValue(
				'--wp-dataviews-first-column-offset'
			)
		).toBe( '0px' );
	} );
} );
