import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TreeSelect from '..';

const tree = [
	{
		name: 'Page 1',
		id: 'p1',
		children: [ { name: 'Descend 1 of page 1', id: 'p11' } ],
	},
	{
		name: 'Page 2',
		id: 'p2',
	},
];

describe( 'TreeSelect', () => {
	it( 'should show flattened tree options including nested children', () => {
		render( <TreeSelect label="Parent page" tree={ tree } /> );

		expect(
			screen.getByRole( 'option', { name: 'Page 1' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'option', { name: /Descend 1 of page 1/ } )
		).toBeVisible();
	} );

	it( 'should call onChange with the selected node id', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<TreeSelect
				label="Parent page"
				tree={ tree }
				onChange={ onChange }
			/>
		);

		await user.selectOptions( screen.getByRole( 'combobox' ), 'p11' );

		expect( onChange ).toHaveBeenCalledWith( 'p11', expect.anything() );
	} );

	it( 'should show noOptionLabel as an option', () => {
		render(
			<TreeSelect
				label="Parent page"
				noOptionLabel="No parent page"
				tree={ tree }
			/>
		);

		expect(
			screen.getByRole( 'option', { name: 'No parent page' } )
		).toBeVisible();
	} );

	it( 'should call onChange with an array of selected node ids when multiple', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<TreeSelect
				label="Parent page"
				multiple
				tree={ tree }
				onChange={ onChange }
			/>
		);

		const listbox = screen.getByRole( 'listbox' );
		await user.selectOptions( listbox, [ 'p1', 'p11' ] );

		expect( onChange ).toHaveBeenCalledWith(
			[ 'p1', 'p11' ],
			expect.anything()
		);
	} );

	/* eslint-disable jest/expect-expect */
	describe( 'static typing', () => {
		it( 'should reject a string selectedId when multiple is true', () => {
			<TreeSelect
				multiple
				// @ts-expect-error string is not an array of node ids
				selectedId="p1"
			/>;

			<TreeSelect
				selectedId="p1"
				onChange={ ( value ) => {
					const _id: string = value;
					return _id;
				} }
			/>;

			<TreeSelect
				multiple
				selectedId={ [ 'p1' ] }
				onChange={ ( value ) => {
					const _ids: string[] = value;
					return _ids;
				} }
			/>;
		} );
	} );
	/* eslint-enable jest/expect-expect */
} );
