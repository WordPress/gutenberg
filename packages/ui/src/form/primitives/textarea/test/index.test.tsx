import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';
import { Textarea } from '../index';

describe( 'Textarea', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLTextAreaElement >();

		render( <Textarea ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLTextAreaElement );
	} );

	describe( 'value prop', () => {
		it( 'renders with controlled value', () => {
			render( <Textarea value="Hello, world!" /> );

			const textarea = screen.getByRole( 'textbox' );
			expect( textarea ).toHaveValue( 'Hello, world!' );
		} );
	} );

	describe( 'defaultValue prop', () => {
		it( 'renders with default value', () => {
			render( <Textarea defaultValue="Default content" /> );

			const textarea = screen.getByRole( 'textbox' );
			expect( textarea ).toHaveValue( 'Default content' );
		} );

		it( 'allows user to modify uncontrolled value', async () => {
			const user = userEvent.setup();
			render( <Textarea defaultValue="Default content" /> );

			const textarea = screen.getByRole( 'textbox' );
			expect( textarea ).toHaveValue( 'Default content' );

			// Clear and type new content
			await user.clear( textarea );
			await user.type( textarea, 'New content' );

			expect( textarea ).toHaveValue( 'New content' );
		} );
	} );

	describe( 'onValueChange prop', () => {
		it( 'calls onValueChange when user types', async () => {
			const user = userEvent.setup();
			const handleValueChange = jest.fn();

			render(
				<Textarea defaultValue="" onValueChange={ handleValueChange } />
			);

			const textarea = screen.getByRole( 'textbox' );

			await user.type( textarea, 'Hello' );

			expect( handleValueChange ).toHaveBeenLastCalledWith(
				'Hello',
				expect.any( Object )
			);

			await user.clear( textarea );

			expect( handleValueChange ).toHaveBeenLastCalledWith(
				'',
				expect.any( Object )
			);
		} );

		it( 'works with controlled component pattern', async () => {
			const user = userEvent.setup();
			const handleValueChange = jest.fn();

			const ControlledTextarea = () => {
				const [ value, setValue ] = useState( 'Initial' );

				return (
					<Textarea
						value={ value }
						onValueChange={ ( newValue ) => {
							handleValueChange( newValue );
							setValue( newValue );
						} }
					/>
				);
			};

			render( <ControlledTextarea /> );

			const textarea = screen.getByRole( 'textbox' );

			await user.clear( textarea );
			await user.type( textarea, 'Updated' );

			expect( handleValueChange ).toHaveBeenLastCalledWith( 'Updated' );
		} );
	} );

	describe( 'render prop', () => {
		it( 'correctly merges props with custom render function', () => {
			render(
				<Textarea
					render={ ( props ) => (
						<div data-testid="my-render" { ...props } />
					) }
					data-my-attribute
				/>
			);

			expect( screen.getByTestId( 'my-render' ) ).toHaveAttribute(
				'data-my-attribute'
			);
		} );

		it( 'correctly merges props with custom render element', () => {
			render(
				<Textarea
					render={ <div data-testid="my-render" /> }
					data-my-attribute
				/>
			);

			expect( screen.getByTestId( 'my-render' ) ).toHaveAttribute(
				'data-my-attribute'
			);
		} );
	} );

	it( 'disables the textarea when disabled prop is true', () => {
		render( <Textarea disabled /> );

		expect( screen.getByRole( 'textbox' ) ).toBeDisabled();
	} );

	it( 'applies custom rows value', () => {
		render( <Textarea rows={ 10 } /> );

		expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'rows', '10' );
	} );
} );
