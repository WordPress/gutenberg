import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import Dataform from '../index';
import useFormValidity from '../../hooks/use-form-validity';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

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

		it( 'should edit time fields with a time input', async () => {
			const onChange = jest.fn();
			const fieldsWithTime = [
				...fields,
				{
					id: 'startTime',
					label: 'Start time',
					type: 'time' as const,
				},
			];
			render(
				<Dataform
					onChange={ onChange }
					fields={ fieldsWithTime }
					form={ { ...form, fields: [ 'startTime' ] } }
					data={ { ...data, startTime: '14:30' } }
				/>
			);

			const timeInput = screen.getByLabelText( /start time/i );
			expect( timeInput ).toHaveAttribute( 'type', 'time' );
			expect( timeInput ).toHaveValue( '14:30' );

			const user = userEvent.setup();
			await user.clear( timeInput );
			await user.type( timeInput, '18:45' );

			expect( onChange ).toHaveBeenLastCalledWith( {
				startTime: '18:45',
			} );
		} );

		it( 'should constrain the time input to the field min, max and format', () => {
			const fieldsWithTime = [
				...fields,
				{
					id: 'startTime',
					label: 'Start time',
					type: 'time' as const,
					format: { time: 'H:i:s' },
					isValid: { min: '09:00', max: '17:00' },
				},
			];
			render(
				<Dataform
					onChange={ noop }
					fields={ fieldsWithTime }
					form={ { ...form, fields: [ 'startTime' ] } }
					data={ { ...data, startTime: '14:30' } }
				/>
			);

			const timeInput = screen.getByLabelText( /start time/i );
			expect( timeInput ).toHaveAttribute( 'min', '09:00' );
			expect( timeInput ).toHaveAttribute( 'max', '17:00' );
			// Seconds in the format make the input offer a seconds field.
			expect( timeInput ).toHaveAttribute( 'step', '1' );
		} );

		it( 'should normalize tolerated time values for the time input', () => {
			const fieldsWithTime = [
				...fields,
				{
					id: 'startTime',
					label: 'Start time',
					type: 'time' as const,
				},
			];
			const renderWithValue = ( startTime: string ) => (
				<Dataform
					onChange={ noop }
					fields={ fieldsWithTime }
					form={ { ...form, fields: [ 'startTime' ] } }
					data={ { ...data, startTime } }
				/>
			);
			const { rerender } = render( renderWithValue( '9:30' ) );

			// `input[type=time]` accepts only zero-padded `HH:mm[:ss]`.
			const timeInput = screen.getByLabelText( /start time/i );
			expect( timeInput ).toHaveValue( '09:30' );

			rerender( renderWithValue( '14:30Z' ) );
			expect( timeInput ).toHaveValue( '14:30' );

			// A value carrying seconds gets a seconds field even when the
			// format does not ask for them.
			rerender( renderWithValue( '14:30:45' ) );
			expect( timeInput ).toHaveValue( '14:30:45' );
			expect( timeInput ).toHaveAttribute( 'step', '1' );
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

			const titleButton = fieldsSelector.title.view();
			const user = await userEvent.setup();
			await user.click( titleButton );
			const titleEditField = screen.getByText(
				'This is the Title Field'
			);
			expect( titleEditField ).toBeInTheDocument();
		} );
	} );

	describe( 'in card mode', () => {
		const fieldsWithRequiredTitle = fields.map( ( field ) =>
			field.id === 'title'
				? { ...field, isValid: { required: true } }
				: field
		);

		const formCardMode = {
			layout: { type: 'card' } as const,
			fields: [
				{
					id: 'mainCard',
					label: 'Main card',
					children: [ 'title', 'order', 'author' ],
				},
			],
		};

		it( 'should preserve the natural tab order when a field inside the card is blurred', async () => {
			const user = userEvent.setup();
			render(
				<Dataform
					onChange={ noop }
					fields={ fieldsWithRequiredTitle }
					form={ formCardMode }
					// Empty title makes the required field invalid.
					data={ { ...data, title: '' } }
				/>
			);

			const titleInput = screen.getByRole( 'textbox', {
				name: /title/i,
			} );
			const orderInput = fieldsSelector.order.edit();
			await user.click( orderInput );
			await user.tab();

			// Focus is not hijacked by the invalid field...
			expect( titleInput ).not.toHaveFocus();
			// ...and moving focus within the card doesn't show errors
			// for fields the user hasn't interacted with.
			expect(
				screen.queryByText( 'Constraints not satisfied' )
			).not.toBeInTheDocument();
		} );

		it( 'should show errors for invalid fields when focus leaves the card, without moving focus', async () => {
			const user = userEvent.setup();
			render(
				<>
					<Dataform
						onChange={ noop }
						fields={ fieldsWithRequiredTitle }
						form={ formCardMode }
						data={ { ...data, title: '' } }
					/>
					<button type="button">Outside</button>
				</>
			);

			const orderInput = fieldsSelector.order.edit();
			await user.click( orderInput );

			const outsideButton = screen.getByRole( 'button', {
				name: 'Outside',
			} );
			await user.click( outsideButton );

			// The required error for the untouched title field is shown...
			expect(
				await screen.findByText( 'Constraints not satisfied' )
			).toBeVisible();
			// ...but focus is not moved back into the card.
			expect( outsideButton ).toHaveFocus();
		} );

		it( 'should not show errors when tabbing past the header of a collapsed card', async () => {
			const user = userEvent.setup();
			render(
				<>
					<Dataform
						onChange={ noop }
						fields={ fieldsWithRequiredTitle }
						form={ {
							...formCardMode,
							fields: [
								{
									...formCardMode.fields[ 0 ],
									layout: {
										type: 'card' as const,
										isOpened: false,
									},
								},
							],
						} }
						data={ { ...data, title: '' } }
					/>
					<button type="button">Outside</button>
				</>
			);

			// Tab to the collapse toggle, then past it, without ever
			// expanding the card.
			await user.tab();
			expect(
				screen.getByRole( 'button', { name: /main card/i } )
			).toHaveFocus();
			await user.tab();

			expect(
				screen.getByRole( 'button', { name: 'Outside' } )
			).toHaveFocus();
			expect(
				screen.queryByText( /needs? attention/ )
			).not.toBeInTheDocument();
		} );

		it( 'should show errors for fields that become invalid after focus already left the card once', async () => {
			const user = userEvent.setup();

			// The title is only valid while the order is 1, so it can become
			// invalid without the user ever focusing it.
			const fieldsWithCrossFieldRule = fields.map( ( field ) =>
				field.id === 'title'
					? {
							...field,
							isValid: {
								custom: ( item: typeof data ) =>
									item.order === 1
										? null
										: 'Title is not allowed for this order.',
							},
					  }
					: field
			);

			function ControlledForm() {
				const [ item, setItem ] = useState( data );
				const { validity } = useFormValidity(
					item,
					fieldsWithCrossFieldRule,
					formCardMode
				);
				return (
					<>
						<Dataform
							onChange={ ( edits ) =>
								setItem( ( prev ) => ( {
									...prev,
									...edits,
								} ) )
							}
							fields={ fieldsWithCrossFieldRule }
							form={ formCardMode }
							data={ item }
							validity={ validity }
						/>
						<button type="button">Outside</button>
					</>
				);
			}

			render( <ControlledForm /> );

			const outsideButton = screen.getByRole( 'button', {
				name: 'Outside',
			} );
			const errorText = 'Title is not allowed for this order.';

			// Leave the card once while every field is still valid.
			await user.click( fieldsSelector.order.edit() );
			await user.click( outsideButton );
			expect( screen.queryByText( errorText ) ).not.toBeInTheDocument();

			// Invalidate the never-focused title field, then leave again.
			await user.type( fieldsSelector.order.edit(), '2' );
			await user.click( outsideButton );

			expect( await screen.findByText( errorText ) ).toBeVisible();
		} );

		it( 'should announce how many fields need attention when focus leaves the card', async () => {
			const user = userEvent.setup();
			render(
				<>
					<Dataform
						onChange={ noop }
						fields={ fieldsWithRequiredTitle }
						form={ formCardMode }
						data={ { ...data, title: '' } }
						validity={ {
							mainCard: {
								children: {
									title: {
										required: {
											type: 'invalid' as const,
											message: 'Title is required.',
										},
									},
								},
							},
						} }
					/>
					<button type="button">Outside</button>
				</>
			);

			await user.click( fieldsSelector.order.edit() );
			await user.click(
				screen.getByRole( 'button', { name: 'Outside' } )
			);

			expect( speak ).toHaveBeenCalledWith(
				'1 field needs attention',
				'polite'
			);
		} );

		it( 'should not announce when focus leaves the card while it is collapsed', async () => {
			const user = userEvent.setup();
			render(
				<>
					<Dataform
						onChange={ noop }
						fields={ fieldsWithRequiredTitle }
						form={ formCardMode }
						data={ { ...data, title: '' } }
						validity={ {
							mainCard: {
								children: {
									title: {
										required: {
											type: 'invalid' as const,
											message: 'Title is required.',
										},
									},
								},
							},
						} }
					/>
					<button type="button">Outside</button>
				</>
			);

			// Focus a field inside the card, then collapse it. The toggle is
			// inside the card, so focus hasn't left it yet.
			await user.click( fieldsSelector.order.edit() );
			await user.click(
				screen.getByRole( 'button', { name: /main card/i } )
			);
			jest.mocked( speak ).mockClear();

			await user.click(
				screen.getByRole( 'button', { name: 'Outside' } )
			);

			expect( speak ).not.toHaveBeenCalled();
		} );

		it( 'should show errors for invalid fields after the card is collapsed and expanded', async () => {
			const user = userEvent.setup();
			render(
				<Dataform
					onChange={ noop }
					fields={ fieldsWithRequiredTitle }
					form={ formCardMode }
					data={ { ...data, title: '' } }
				/>
			);

			expect(
				screen.queryByText( 'Constraints not satisfied' )
			).not.toBeInTheDocument();

			const toggle = screen.getByRole( 'button', {
				name: /main card/i,
			} );
			await user.click( toggle );
			await user.click( toggle );

			expect(
				await screen.findByText( 'Constraints not satisfied' )
			).toBeVisible();
		} );
	} );

	describe( 'in details mode', () => {
		const fieldsWithRequiredTitle = fields.map( ( field ) =>
			field.id === 'title'
				? { ...field, isValid: { required: true } }
				: field
		);

		const formDetailsMode = {
			layout: { type: 'details' as const },
			fields: [
				{
					id: 'moreDetails',
					label: 'More details',
					children: [ 'title', 'order' ],
				},
			],
		};

		it( 'should show errors for invalid fields once focus leaves it', async () => {
			const user = userEvent.setup();
			render(
				<>
					<Dataform
						onChange={ noop }
						fields={ fieldsWithRequiredTitle }
						form={ formDetailsMode }
						data={ { ...data, title: '' } }
					/>
					<button type="button">Outside</button>
				</>
			);

			// Expand the disclosure so its fields, and any error they show,
			// are visible.
			await user.click( screen.getByText( 'More details' ) );
			await waitFor( () =>
				expect( fieldsSelector.order.edit() ).toBeVisible()
			);
			await user.click( fieldsSelector.order.edit() );

			// Leave by keyboard: a click would re-assign focus afterwards and
			// mask a focus steal.
			await user.tab();

			expect(
				await screen.findByText( 'Constraints not satisfied' )
			).toBeVisible();
			expect(
				screen.getByRole( 'button', { name: 'Outside' } )
			).toHaveFocus();
		} );

		it( 'should not announce when focus leaves it while collapsed', async () => {
			const user = userEvent.setup();
			render(
				<>
					<Dataform
						onChange={ noop }
						fields={ fieldsWithRequiredTitle }
						form={ formDetailsMode }
						data={ { ...data, title: '' } }
						validity={ {
							moreDetails: {
								children: {
									title: {
										required: {
											type: 'invalid' as const,
											message: 'Title is required.',
										},
									},
								},
							},
						} }
					/>
					<button type="button">Outside</button>
				</>
			);

			// Expand the disclosure and focus a field inside it.
			const summary = screen.getByText( 'More details' );
			await user.click( summary );
			await waitFor( () =>
				expect( fieldsSelector.order.edit() ).toBeVisible()
			);
			await user.click( fieldsSelector.order.edit() );

			// Close it while focus is still inside, as when the summary is
			// clicked in a browser, where it receives focus. jsdom leaves
			// focus where it was, so close programmatically instead.
			// eslint-disable-next-line testing-library/no-node-access
			const details = summary.closest( 'details' );
			await act( async () => {
				details!.open = false;
			} );
			jest.mocked( speak ).mockClear();

			await user.click(
				screen.getByRole( 'button', { name: 'Outside' } )
			);

			expect( speak ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'datetime fields', () => {
		const datetimeFields = [
			{
				id: 'date',
				label: 'Date',
				type: 'datetime' as const,
				isValid: { required: true },
			},
		];

		const datetimeForm = {
			fields: [ 'date' ],
		};

		const dayButton = ( date: Date ) =>
			screen.getByRole( 'button', {
				name: new RegExp(
					new Intl.DateTimeFormat( 'en-US', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					} ).format( date )
				),
			} );

		// Waits out any timeouts scheduled by the control, so that a
		// duplicate update scheduled for a later tick is not missed.
		const flushTimeouts = () =>
			act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 10 ) )
			);

		function ControlledForm( {
			onChange: onChangeProp = noop,
		}: {
			onChange?: ( edits: { date?: string } ) => void;
		} ) {
			const [ item, setItem ] = useState< {
				date: string | undefined;
			} >( { date: '2026-01-10T10:00:00.000Z' } );
			return (
				<Dataform
					onChange={ ( edits ) => {
						onChangeProp( edits );
						setItem( ( prev ) => ( { ...prev, ...edits } ) );
					} }
					fields={ datetimeFields }
					form={ datetimeForm }
					data={ item }
				/>
			);
		}

		it( 'should call onChange once when a date is selected in the calendar', async () => {
			const onChange = jest.fn();
			const user = userEvent.setup();
			render(
				<Dataform
					onChange={ onChange }
					fields={ datetimeFields }
					form={ datetimeForm }
					data={ { date: '2026-01-10T10:00:00.000Z' } }
				/>
			);

			await user.click( dayButton( new Date( 2026, 0, 15 ) ) );
			await flushTimeouts();

			expect( onChange ).toHaveBeenCalledTimes( 1 );
			// The time is preserved from the previous value.
			expect( onChange ).toHaveBeenCalledWith( {
				date: '2026-01-15T10:00:00.000Z',
			} );
			expect( speak ).not.toHaveBeenCalled();
		} );

		it( 'should call onChange once and show the required error when the date is cleared, keeping focus on the day button', async () => {
			const onChange = jest.fn();
			const user = userEvent.setup();

			render( <ControlledForm onChange={ onChange } /> );

			// Clicking the selected day deselects it.
			await user.click( dayButton( new Date( 2026, 0, 10 ) ) );
			await flushTimeouts();

			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( { date: undefined } );
			expect(
				await screen.findByText( 'Constraints not satisfied' )
			).toBeVisible();
			// Focus does not move, so the error is announced instead.
			expect( speak ).toHaveBeenCalledWith( 'Constraints not satisfied' );
			expect( dayButton( new Date( 2026, 0, 10 ) ) ).toHaveFocus();
		} );

		it( 'should clear the revealed error when a valid date is selected in the calendar', async () => {
			const user = userEvent.setup();

			render( <ControlledForm /> );

			// Clicking the selected day deselects it, making the field invalid.
			await user.click( dayButton( new Date( 2026, 0, 10 ) ) );
			await flushTimeouts();

			expect(
				await screen.findByText( 'Constraints not satisfied' )
			).toBeVisible();

			await user.click( dayButton( new Date( 2026, 0, 15 ) ) );
			await flushTimeouts();

			expect(
				screen.queryByText( 'Constraints not satisfied' )
			).not.toBeInTheDocument();
		} );
	} );
} );
