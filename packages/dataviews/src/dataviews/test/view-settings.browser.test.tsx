import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { useId, useState } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import '@wordpress/components/build-style/style.css';
import '../../style.scss';
import DataViews from '../index';
import type { DataFormControlProps, Field, View } from '../../types';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';

type Post = { id: number; title: string; author: string };
const posts: Post[] = [
	{ id: 1, title: 'Hello World', author: 'jane' },
	{ id: 2, title: 'Homepage', author: 'john' },
];
const fields: Field< Post >[] = [
	{ id: 'title', label: 'Title', type: 'text', filterBy: false },
	{
		id: 'author',
		label: 'Author',
		type: 'text',
		elements: [
			{ value: 'jane', label: 'Jane' },
			{ value: 'john', label: 'John' },
		],
		filterBy: { operators: [ 'is' ] },
	},
];
const defaultView: View = {
	type: 'table',
	titleField: 'title',
	fields: [ 'author' ],
	sort: { field: 'title', direction: 'asc' },
	page: 1,
	perPage: 10,
	filters: [],
};

function WideAuthorControl( {
	data,
	field,
	onChange,
}: DataFormControlProps< Post > ) {
	const inputId = useId();
	return (
		<div
			role="group"
			aria-label="Wide author filter"
			style={ {
				minWidth: 600,
				minHeight: 600,
				display: 'flex',
				alignItems: 'flex-start',
				justifyContent: 'space-between',
			} }
		>
			<label htmlFor={ inputId }>
				Author name
				<input
					id={ inputId }
					value={ field.getValue( { item: data } ) ?? '' }
					onChange={ ( event ) =>
						onChange( { ...data, author: event.target.value } )
					}
				/>
			</label>
			<button
				style={ { alignSelf: 'flex-end' } }
				onClick={ () => onChange( { ...data, author: 'john' } ) }
			>
				Use John
			</button>
		</div>
	);
}

const wideFields: Field< Post >[] = [
	fields[ 0 ],
	{
		id: 'author',
		label: 'Author',
		type: 'text',
		Edit: WideAuthorControl,
		filterBy: { operators: [ 'is' ] },
	},
];

function ViewSettingsExample( {
	onChange = () => {},
	initialView = defaultView,
	fields: exampleFields = fields,
}: {
	onChange?: ( view: View ) => void;
	initialView?: View;
	fields?: Field< Post >[];
} ) {
	const [ view, setView ] = useState( initialView );
	const { data, paginationInfo } = filterSortAndPaginate(
		posts,
		view,
		exampleFields
	);
	return (
		<DataViews
			data={ data }
			fields={ exampleFields }
			view={ view }
			onChangeView={ ( nextView ) => {
				onChange( nextView );
				setView( nextView );
			} }
			onReset={
				view === defaultView ? false : () => setView( defaultView )
			}
			getItemId={ ( post ) => post.id.toString() }
			paginationInfo={ paginationInfo }
			defaultLayouts={ { table: {}, grid: {} } }
		/>
	);
}

describe( 'View settings', () => {
	it( 'keeps wide custom filter controls reachable in view settings', async () => {
		const viewport = {
			width: window.innerWidth,
			height: window.innerHeight,
		};
		await page.viewport( 390, 568 );
		try {
			const onChange = vi.fn();
			await render(
				<ViewSettingsExample
					fields={ wideFields }
					onChange={ onChange }
				/>
			);
			const trigger = page.getByRole( 'button', {
				name: 'View options',
			} );
			await userEvent.click( trigger );
			const drawer = page.getByRole( 'dialog', {
				name: 'View settings',
			} );
			await userEvent.click(
				drawer.getByRole( 'tab', { name: 'Filters', exact: true } )
			);
			await userEvent.click(
				drawer.getByRole( 'button', { name: 'Add filter' } )
			);
			await userEvent.click(
				page.getByRole( 'menuitem', { name: 'Author' } )
			);
			const wideControl = drawer.getByRole( 'group', {
				name: 'Wide author filter',
			} );
			await expect.element( wideControl ).toBeVisible();
			const findScrollRegion = () => {
				let element = wideControl.element().parentElement;
				while ( element && drawer.element().contains( element ) ) {
					if (
						element.scrollWidth > element.clientWidth &&
						[ 'auto', 'scroll' ].includes(
							getComputedStyle( element ).overflowX
						)
					) {
						return element;
					}
					element = element.parentElement;
				}
				return null;
			};
			await expect.poll( findScrollRegion ).not.toBeNull();
			const scrollRegion = findScrollRegion()!;
			const drawerBounds = drawer.element().getBoundingClientRect();
			const editorBounds = scrollRegion.getBoundingClientRect();
			expect( editorBounds.left ).toBeGreaterThanOrEqual(
				drawerBounds.left
			);
			expect( editorBounds.right ).toBeLessThanOrEqual(
				drawerBounds.right
			);
			await userEvent.click(
				drawer.getByRole( 'textbox', { name: 'Author name' } )
			);
			await userEvent.tab();
			const useJohn = drawer.getByRole( 'button', { name: 'Use John' } );
			await expect.element( useJohn ).toHaveFocus();
			expect( scrollRegion.scrollLeft ).toBeGreaterThan( 0 );
			expect( scrollRegion.scrollTop ).toBeGreaterThan( 0 );
			const actionBounds = useJohn.element().getBoundingClientRect();
			expect( actionBounds.right ).toBeLessThanOrEqual(
				editorBounds.right
			);
			expect( actionBounds.bottom ).toBeLessThanOrEqual(
				editorBounds.bottom
			);
			await userEvent.click( useJohn );
			expect( onChange ).toHaveBeenLastCalledWith(
				expect.objectContaining( {
					filters: [
						{ field: 'author', operator: 'is', value: 'john' },
					],
				} )
			);
			await userEvent.keyboard( '{Escape}' );
			await expect.element( drawer ).toBeVisible();
			await expect
				.element(
					drawer.getByRole( 'button', {
						name: 'Author is: john',
						exact: true,
					} )
				)
				.toHaveFocus();
			await userEvent.click(
				drawer.getByRole( 'button', { name: 'Close', exact: true } )
			);
			await expect.element( trigger ).toHaveFocus();
		} finally {
			await page.viewport( viewport.width, viewport.height );
		}
	} );

	it( 'updates the view from the settings drawer', async () => {
		const onChange = vi.fn();
		await render( <ViewSettingsExample onChange={ onChange } /> );
		await userEvent.click(
			page.getByRole( 'button', { name: 'View options' } )
		);
		const drawer = page.getByRole( 'dialog', { name: 'View settings' } );
		await userEvent.click(
			drawer.getByRole( 'combobox', { name: 'Layout', exact: true } )
		);
		await userEvent.click(
			page.getByRole( 'option', { name: 'Grid', exact: true } )
		);
		expect( onChange ).toHaveBeenLastCalledWith(
			expect.objectContaining( { type: 'grid' } )
		);
		await expect.element( drawer ).toBeVisible();
		await userEvent.click(
			drawer.getByRole( 'tab', { name: 'Property visibility' } )
		);
		await userEvent.click(
			drawer.getByRole( 'button', { name: 'Author', exact: true } )
		);
		expect( onChange ).toHaveBeenLastCalledWith(
			expect.objectContaining( { type: 'grid', fields: [] } )
		);
	} );

	it( 'adds the first filter without opening the toolbar dropdown', async () => {
		const onChange = vi.fn();
		await render( <ViewSettingsExample onChange={ onChange } /> );
		const trigger = page.getByRole( 'button', { name: 'View options' } );
		await userEvent.click( trigger );
		const drawer = page.getByRole( 'dialog', { name: 'View settings' } );
		await userEvent.click(
			drawer.getByRole( 'tab', { name: 'Filters', exact: true } )
		);
		await expect
			.element( drawer.getByText( 'No filters applied.' ) )
			.toBeVisible();
		await userEvent.click(
			drawer.getByRole( 'button', { name: 'Add filter' } )
		);
		await userEvent.click(
			page.getByRole( 'menuitem', { name: 'Author' } )
		);
		// Only the drawer's filter editor opens; the toolbar shares its value.
		await expect
			.element(
				page.getByRole( 'option', { name: 'John', exact: true } )
			)
			.toBeVisible();
		await userEvent.click(
			page.getByRole( 'option', { name: 'John', exact: true } )
		);
		expect( onChange ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				filters: [ { field: 'author', operator: 'is', value: 'john' } ],
			} )
		);
		await userEvent.keyboard( '{Escape}' );
		await expect.element( drawer ).toBeVisible();
		await userEvent.click(
			drawer.getByRole( 'button', { name: 'Close', exact: true } )
		);
		await expect.element( trigger ).toHaveFocus();
		await expect
			.element(
				page
					.getByRole( 'table' )
					.getByRole( 'cell', { name: 'Hello World' } )
			)
			.not.toBeInTheDocument();
		await expect
			.element(
				page
					.getByRole( 'table' )
					.getByRole( 'cell', { name: 'Homepage' } )
			)
			.toBeVisible();
		await expect
			.element( page.getByRole( 'button', { name: /Author.*John/ } ) )
			.toHaveAttribute( 'aria-expanded', 'false' );
	} );

	it( 'resets the view from the Filters tab', async () => {
		await render(
			<ViewSettingsExample
				initialView={ {
					...defaultView,
					type: 'grid',
					filters: [
						{ field: 'author', operator: 'is', value: 'john' },
					],
				} }
			/>
		);
		await userEvent.click(
			page.getByRole( 'button', { name: 'View options' } )
		);
		const drawer = page.getByRole( 'dialog', { name: 'View settings' } );
		await userEvent.click(
			drawer.getByRole( 'tab', { name: 'Filters', exact: true } )
		);
		await userEvent.click(
			drawer.getByRole( 'button', { name: 'Reset view', exact: true } )
		);
		await expect
			.element( drawer.getByText( 'No filters applied.' ) )
			.toBeVisible();
		await expect
			.element( drawer.getByRole( 'button', { name: 'Reset view' } ) )
			.toHaveAttribute( 'aria-disabled', 'true' );
		await userEvent.click(
			drawer.getByRole( 'button', { name: 'Close', exact: true } )
		);
		await expect
			.element(
				page
					.getByRole( 'table' )
					.getByRole( 'cell', { name: 'Hello World' } )
			)
			.toBeVisible();
		await expect
			.element(
				page
					.getByRole( 'table' )
					.getByRole( 'cell', { name: 'Homepage' } )
			)
			.toBeVisible();
	} );
} );
