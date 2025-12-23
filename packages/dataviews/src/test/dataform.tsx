/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Dataform from '../components/dataform/index';

const noop = () => {};

const fields = [
	{
		id: 'title',
		label: 'Title',
		type: 'text' as const,
	},
	{
		id: 'order',
		label: 'Order',
		type: 'integer' as const,
	},
	{
		id: 'author',
		label: 'Author',
		type: 'integer' as const,
		elements: [
			{ value: 1, label: 'Jane' },
			{ value: 2, label: 'John' },
		],
	},
];

const form = {
	fields: [ 'title', 'order', 'author' ],
};

const data = {
	title: 'Hello World',
	author: 1,
	order: 1,
};

const fieldsSelector = {
	title: {
		view: () =>
			screen.getByRole( 'button', {
				name: /edit title/i,
			} ),
		edit: () =>
			screen.getByRole( 'textbox', {
				name: /title/i,
			} ),
	},
	author: {
		view: () =>
			screen.getByRole( 'button', {
				name: /edit author/i,
			} ),
		edit: () =>
			screen.queryByRole( 'combobox', {
				name: /author/i,
			} ),
	},
	order: {
		view: () =>
			screen.getByRole( 'button', {
				name: /edit order/i,
			} ),
		edit: () =>
			screen.getByRole( 'spinbutton', {
				name: /order/i,
			} ),
	},
};

describe( 'DataForm component', () => {
	describe( 'in regular mode', () => {
		it( 'should display fields', () => {
			render(
				<Dataform
					onChange={ noop }
					fields={ fields }
					form={ form }
					data={ data }
				/>
			);

			expect( fieldsSelector.title.edit() ).toBeInTheDocument();
			expect( fieldsSelector.order.edit() ).toBeInTheDocument();
			expect( fieldsSelector.author.edit() ).toBeInTheDocument();
		} );

		it( 'should render custom Edit component', () => {
			const fieldsWithCustomEditComponent = fields.map( ( field ) => {
				if ( field.id === 'title' ) {
					return {
						...field,
						Edit: () => {
							return <span>This is the Title Field</span>;
						},
					};
				}
				return field;
			} );

			render(
				<Dataform
					onChange={ noop }
					fields={ fieldsWithCustomEditComponent }
					form={ form }
					data={ data }
				/>
			);

			const titleField = screen.getByText( 'This is the Title Field' );
			expect( titleField ).toBeInTheDocument();
		} );

		it( 'should call onChange with the correct value for each typed character', async () => {
			const onChange = jest.fn();
			render(
				<Dataform
					onChange={ onChange }
					fields={ fields }
					form={ form }
					data={ { ...data, title: '' } }
				/>
			);

			const titleInput = fieldsSelector.title.edit();
			const user = userEvent.setup();
			await user.clear( titleInput );
			expect( titleInput ).toHaveValue( '' );
			const newValue = 'Hello folks!';
			await user.type( titleInput, newValue );
			expect( onChange ).toHaveBeenCalledTimes( newValue.length );
			for ( let i = 0; i < newValue.length; i++ ) {
				expect( onChange ).toHaveBeenNthCalledWith( i + 1, {
					title: newValue.slice( 0, i + 1 ),
				} );
			}
		} );

		it( 'should allow decimal input for number fields', async () => {
			const onChange = jest.fn();
			const fieldsWithNumber = [
				...fields,
				{
					id: 'price',
					label: 'Price',
					type: 'number' as const,
				},
			];
			const formWithNumber = {
				...form,
				fields: [ ...form.fields, 'price' ],
			};
			render(
				<Dataform
					onChange={ onChange }
					fields={ fieldsWithNumber }
					form={ formWithNumber }
					data={ { ...data, price: 2.5 } }
				/>
			);

			const priceInput = screen.getByRole( 'spinbutton', {
				name: /price/i,
			} );
			expect( priceInput ).toHaveValue( 2.5 );

			const user = userEvent.setup();
			await user.clear( priceInput );
			await user.type( priceInput, '3.75' );

			expect( onChange ).toHaveBeenLastCalledWith( { price: 3.75 } );
			expect( priceInput ).toHaveValue( 3.75 );
		} );

		it( 'should render combined fields correctly', async () => {
			const formWithCombinedFields = {
				fields: [
					'order',
					{
						id: 'title',
						children: [ 'title', 'author' ],
						label: "Title and author's name",
					},
				],
			};

			render(
				<Dataform
					onChange={ noop }
					fields={ fields }
					form={ formWithCombinedFields }
					data={ data }
				/>
			);

			expect(
				screen.getByText( "Title and author's name" )
			).toBeInTheDocument();
		} );
	} );

	describe( 'in panel mode', () => {
		const formPanelMode = {
			...form,
			layout: {
				type: 'panel',
				labelPosition: 'side',
			} as const,
		};
		it( 'should display fields', async () => {
			render(
				<Dataform
					onChange={ noop }
					fields={ fields }
					form={ formPanelMode }
					data={ data }
				/>
			);

			const user = await userEvent.setup();

			for ( const field of Object.values( fieldsSelector ) ) {
				const button = field.view();
				await user.click( button );
				expect( field.edit() ).toBeInTheDocument();
			}
		} );

		it( 'should use dropdown panel type by default', async () => {
			render(
				<Dataform
					onChange={ noop }
					fields={ fields }
					form={ formPanelMode }
					data={ data }
				/>
			);

			const user = await userEvent.setup();
			const titleButton = fieldsSelector.title.view();
			await user.click( titleButton );

			// Should show dropdown content (not modal)
			expect(
				screen.getByRole( 'textbox', { name: /title/i } )
			).toBeInTheDocument();
			// Should not have modal dialog
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
			// Should not have modal buttons (Cancel/Apply)
			expect(
				screen.queryByRole( 'button', { name: /cancel/i } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: /apply/i } )
			).not.toBeInTheDocument();
		} );

		it( 'should use dropdown panel type when explicitly set', async () => {
			const formWithDropdownPanel = {
				...form,
				layout: {
					type: 'panel',
					labelPosition: 'side',
					openAs: 'dropdown',
				} as const,
			};

			render(
				<Dataform
					onChange={ noop }
					fields={ fields }
					form={ formWithDropdownPanel }
					data={ data }
				/>
			);

			const user = await userEvent.setup();
			const titleButton = fieldsSelector.title.view();
			await user.click( titleButton );

			// Should show dropdown content
			expect(
				screen.getByRole( 'textbox', { name: /title/i } )
			).toBeInTheDocument();
		} );

		it( 'should use modal panel type when set', async () => {
			const formWithModalPanel = {
				...form,
				layout: {
					type: 'panel',
					labelPosition: 'side',
					openAs: 'modal',
				} as const,
			};

			render(
				<Dataform
					onChange={ noop }
					fields={ fields }
					form={ formWithModalPanel }
					data={ data }
				/>
			);

			const user = await userEvent.setup();
			const titleButton = fieldsSelector.title.view();
			await user.click( titleButton );

			// Should show modal content
			expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			expect(
				screen.getByRole( 'textbox', { name: /title/i } )
			).toBeInTheDocument();
		} );

		it( 'should close modal when cancel button is clicked', async () => {
			const formWithModalPanel = {
				...form,
				layout: {
					type: 'panel',
					labelPosition: 'side',
					openAs: 'modal',
				} as const,
			};

			render(
				<Dataform
					onChange={ noop }
					fields={ fields }
					form={ formWithModalPanel }
					data={ data }
				/>
			);

			const user = await userEvent.setup();
			const titleButton = fieldsSelector.title.view();
			await user.click( titleButton );

			// Modal should be open
			expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();

			// Click cancel button
			const cancelButton = screen.getByRole( 'button', {
				name: /cancel/i,
			} );
			await user.click( cancelButton );

			// Modal should be closed
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );

		it( 'should apply changes and close modal when apply button is clicked', async () => {
			const onChange = jest.fn();
			const formWithModalPanel = {
				...form,
				layout: {
					type: 'panel',
					labelPosition: 'side',
					openAs: 'modal',
				} as const,
			};

			render(
				<Dataform
					onChange={ onChange }
					fields={ fields }
					form={ formWithModalPanel }
					data={ data }
				/>
			);

			const user = await userEvent.setup();
			const titleButton = fieldsSelector.title.view();
			await user.click( titleButton );

			// Modal should be open
			expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();

			// Type in the input
			const titleInput = screen.getByRole( 'textbox', {
				name: /title/i,
			} );
			await user.clear( titleInput );
			await user.type( titleInput, 'New Title' );

			// Click apply button
			const applyButton = screen.getByRole( 'button', {
				name: /apply/i,
			} );
			await user.click( applyButton );

			// Modal should be closed and onChange should be called
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
			expect( onChange ).toHaveBeenCalledWith( { title: 'New Title' } );
		} );

		it( 'should call onChange with the correct value for each typed character', async () => {
			const onChange = jest.fn();
			render(
				<Dataform
					onChange={ onChange }
					fields={ fields }
					form={ formPanelMode }
					data={ { ...data, title: '' } }
				/>
			);

			const titleButton = fieldsSelector.title.view();
			const user = await userEvent.setup();
			await user.click( titleButton );
			const input = fieldsSelector.title.edit();
			expect( input ).toHaveValue( '' );
			const newValue = 'Hello folks!';
			await user.type( input, newValue );
			expect( onChange ).toHaveBeenCalledTimes( newValue.length );
			for ( let i = 0; i < newValue.length; i++ ) {
				expect( onChange ).toHaveBeenNthCalledWith( i + 1, {
					title: newValue.slice( 0, i + 1 ),
				} );
			}
		} );

		it( 'should render combined fields correctly', async () => {
			const formWithCombinedFields = {
				...formPanelMode,
				fields: [
					'order',
					{
						id: 'title',
						children: [ 'title', 'author' ],
						label: "Title and author's name",
					},
				],
			};

			render(
				<Dataform
					onChange={ noop }
					fields={ fields }
					form={ formWithCombinedFields }
					data={ data }
				/>
			);

			const button = screen.getByRole( 'button', {
				name: /edit title and author's name/i,
			} );
			const user = await userEvent.setup();
			await user.click( button );
			expect( fieldsSelector.title.edit() ).toBeInTheDocument();
			expect( fieldsSelector.author.edit() ).toBeInTheDocument();
		} );

		it( 'should render custom render component', async () => {
			const fieldsWithCustomRenderFunction = fields.map( ( field ) => {
				return {
					...field,
					render: () => {
						return <span>This is the { field.id } field</span>;
					},
				};
			} );

			render(
				<Dataform
					onChange={ noop }
					fields={ fieldsWithCustomRenderFunction }
					form={ formPanelMode }
					data={ data }
				/>
			);

			const titleField = screen.getByText( 'This is the title field' );
			const orderField = screen.getByText( 'This is the order field' );
			const authorField = screen.getByText( 'This is the author field' );
			expect( titleField ).toBeInTheDocument();
			expect( orderField ).toBeInTheDocument();
			expect( authorField ).toBeInTheDocument();
		} );

		it( 'should render custom Edit component', async () => {
			const fieldsWithTitleCustomEditComponent = fields.map(
				( field ) => {
					if ( field.id === 'title' ) {
						return {
							...field,
							Edit: () => {
								return <span>This is the Title Field</span>;
							},
						};
					}
					return field;
				}
			);

			render(
				<Dataform
					onChange={ noop }
					fields={ fieldsWithTitleCustomEditComponent }
					form={ formPanelMode }
					data={ data }
				/>
			);

			const titleField = screen.getByText( data.title );
			const user = await userEvent.setup();
			await user.click( titleField );
			const titleEditField = screen.getByText(
				'This is the Title Field'
			);
			expect( titleEditField ).toBeInTheDocument();
		} );
	} );
} );
