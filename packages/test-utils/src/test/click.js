/**
 * External dependencies
 */
import * as React from 'react';

/**
 * Internal dependencies
 */
import render from '../render';
import click from '../click';

describe( 'click', () => {
	it( 'should focus button on click', () => {
		const { getByText } = render( <button>button</button> );
		const button = getByText( 'button' );
		click( button );
		expect( button ).toHaveFocus();
	} );

	it( 'should not focus button on click when event.preventDefault() was called on mouse down', () => {
		const { getByText } = render(
			<button onMouseDown={ ( event ) => event.preventDefault() }>button</button>
		);
		const button = getByText( 'button' );
		click( button );
		expect( button ).not.toHaveFocus();
	} );

	it( 'should not focus disabled button on click', () => {
		const onClick = jest.fn();
		const { getByText } = render(
			<button disabled onClick={ onClick }>
				button
			</button>
		);
		const button = getByText( 'button' );
		click( button );
		expect( button ).not.toHaveFocus();
		expect( onClick ).not.toHaveBeenCalled();
	} );

	it( 'should focus closest focusable parent', () => {
		const { getByText, baseElement } = render(
			<div tabIndex={ -1 }>
				parent
				<div>child</div>
			</div>
		);
		const parent = getByText( 'parent' );
		const child = getByText( 'child' );

		expect( baseElement ).toHaveFocus();
		click( child );
		expect( parent ).toHaveFocus();
	} );

	it( 'should not focus focusable parent if child is disabled', () => {
		const { getByText, baseElement } = render(
			<div tabIndex={ -1 }>
				parent
				<button disabled>child</button>
			</div>
		);
		const child = getByText( 'child' );

		expect( baseElement ).toHaveFocus();
		click( child );
		expect( baseElement ).toHaveFocus();
	} );

	it( 'should focus input when clicking on label', () => {
		const { getByText, getByLabelText, baseElement } = render(
			<>
				<label htmlFor="input1">input1</label>
				{ /* eslint-disable-next-line no-restricted-syntax */ }
				<input id="input1" />
				{ /* eslint-disable-next-line jsx-a11y/label-has-for */ }
				<label>
					input2
					<input />
				</label>
			</>
		);
		const label1 = getByText( 'input1' );
		const input1 = getByLabelText( 'input1' );
		const label2 = getByText( 'input2' );
		const input2 = getByLabelText( 'input2' );

		expect( baseElement ).toHaveFocus();
		click( label1 );
		expect( input1 ).toHaveFocus();
		click( label2 );
		expect( input2 ).toHaveFocus();
	} );

	it( 'should not focus disabled input when clicking on label', () => {
		const { getByText, baseElement } = render(
			<>
				<label htmlFor="input1">input1</label>
				{ /* eslint-disable-next-line no-restricted-syntax */ }
				<input disabled id="input1" />
				{ /* eslint-disable-next-line jsx-a11y/label-has-for */ }
				<label>
					input2
					<input disabled />
				</label>
			</>
		);
		const label1 = getByText( 'input1' );
		const label2 = getByText( 'input2' );

		expect( baseElement ).toHaveFocus();
		click( label1 );
		expect( baseElement ).toHaveFocus();
		click( label2 );
		expect( baseElement ).toHaveFocus();
	} );

	it( 'should check/uncheck checkbox', () => {
		const { getByText, getByLabelText } = render(
			<>
				<input type="checkbox" aria-label="checkbox1" />
				<label htmlFor="checkbox2">checkbox2</label>
				{ /* eslint-disable-next-line no-restricted-syntax */ }
				<input type="checkbox" id="checkbox2" />
				{ /* eslint-disable-next-line jsx-a11y/label-has-for */ }
				<label>
					checkbox3
					<input type="checkbox" />
				</label>
			</>
		);
		const checkbox1 = getByLabelText( 'checkbox1' );
		const label2 = getByText( 'checkbox2' );
		const checkbox2 = getByLabelText( 'checkbox2' );
		const label3 = getByText( 'checkbox3' );
		const checkbox3 = getByLabelText( 'checkbox3' );

		expect( checkbox1 ).not.toBeChecked();
		click( checkbox1 );
		expect( checkbox1 ).toBeChecked();
		click( checkbox1 );
		expect( checkbox1 ).not.toBeChecked();

		expect( checkbox2 ).not.toBeChecked();
		click( label2 );
		expect( checkbox2 ).toBeChecked();
		click( label2 );
		expect( checkbox2 ).not.toBeChecked();

		expect( checkbox3 ).not.toBeChecked();
		click( label3 );
		expect( checkbox3 ).toBeChecked();
		click( label3 );
		expect( checkbox3 ).not.toBeChecked();
	} );

	it( 'should not check/uncheck disabled checkbox', () => {
		const { getByText, getByLabelText } = render(
			<>
				<input type="checkbox" aria-label="checkbox1" disabled />
				<label htmlFor="checkbox2">checkbox2</label>
				{ /* eslint-disable-next-line no-restricted-syntax */ }
				<input type="checkbox" id="checkbox2" disabled />
				{ /* eslint-disable-next-line jsx-a11y/label-has-for */ }
				<label>
					checkbox3
					<input type="checkbox" disabled />
				</label>
			</>
		);
		const checkbox1 = getByLabelText( 'checkbox1' );
		const label2 = getByText( 'checkbox2' );
		const checkbox2 = getByLabelText( 'checkbox2' );
		const label3 = getByText( 'checkbox3' );
		const checkbox3 = getByLabelText( 'checkbox3' );

		expect( checkbox1 ).not.toBeChecked();
		click( checkbox1 );
		expect( checkbox1 ).not.toBeChecked();

		expect( checkbox2 ).not.toBeChecked();
		click( label2 );
		expect( checkbox2 ).not.toBeChecked();

		expect( checkbox3 ).not.toBeChecked();
		click( label3 );
		expect( checkbox3 ).not.toBeChecked();
	} );

	it( 'should change select when clicking on options', async () => {
		const Test = ( { multiple } ) => {
			return (
				<select aria-label="select" multiple={ multiple }>
					<option value="option1">option1</option>
					<option value="option2">option2</option>
					<option value="option3">option3</option>
					<option value="option4">option4</option>
				</select>
			);
		};
		const { getByText, getByLabelText, rerender } = render( <Test /> );
		const select = getByLabelText( 'select' );
		const option1 = getByText( 'option1' );
		const option2 = getByText( 'option2' );
		const option3 = getByText( 'option3' );
		const option4 = getByText( 'option4' );

		click( option2 );

		expect( option2.selected ).toBe( true );
		expect( Array.from( select.selectedOptions ) ).toEqual( [ option2 ] );

		rerender( <Test multiple /> );

		click( option2 );
		click( option4, { shiftKey: true } );
		expect( Array.from( select.selectedOptions ) ).toEqual( [
			option2,
			option3,
			option4,
		] );

		click( option3, { ctrlKey: true } );
		click( option1, { ctrlKey: true } );
		expect( Array.from( select.selectedOptions ) ).toEqual( [
			option1,
			option2,
			option4,
		] );

		click( option3, { shiftKey: true } );
		expect( Array.from( select.selectedOptions ) ).toEqual( [
			option1,
			option2,
			option3,
		] );
	} );
} );
