/**
 * External dependencies
 */
import * as React from 'react';

/**
 * Internal dependencies
 */
import render from '../render';
import press from '../press';

describe( 'press', () => {
	it( 'should focus element when pressing key on it', () => {
		const { getByText } = render( <div tabIndex={ -1 }>div</div> );
		const div = getByText( 'div' );
		expect( div ).not.toHaveFocus();
		press( 'a', div );
		expect( div ).toHaveFocus();
	} );

	it( 'should click button when pressing enter', () => {
		const onClick = jest.fn();
		const { getByText } = render( <button onClick={ onClick }>button</button> );
		const button = getByText( 'button' );
		expect( onClick ).not.toHaveBeenCalled();
		press.Enter( button );
		expect( onClick ).toHaveBeenCalled();
	} );

	it( 'should not click button when pressing enter if event.preventDefault() was called on key down', () => {
		const onClick = jest.fn();
		const { getByText } = render(
			<button onClick={ onClick } onKeyDown={ ( event ) => event.preventDefault() }>
				button
			</button>
		);
		const button = getByText( 'button' );
		expect( onClick ).not.toHaveBeenCalled();
		press.Enter( button );
		expect( onClick ).not.toHaveBeenCalled();
	} );

	it( 'should click button when pressing space', () => {
		const onClick = jest.fn();
		const { getByText } = render( <button onClick={ onClick }>button</button> );
		const button = getByText( 'button' );
		expect( onClick ).not.toHaveBeenCalled();
		press.Space( button );
		expect( onClick ).toHaveBeenCalled();
	} );

	it( 'should not click button when pressing space if event.preventDefault() was called on key down', () => {
		const onClick = jest.fn();
		const { getByText } = render(
			<button onClick={ onClick } onKeyDown={ ( event ) => event.preventDefault() }>
				button
			</button>
		);
		const button = getByText( 'button' );
		expect( onClick ).not.toHaveBeenCalled();
		press.Space( button );
		expect( onClick ).not.toHaveBeenCalled();
	} );

	it( 'should not click button when pressing space if event.preventDefault() was called on key up', () => {
		const onClick = jest.fn();
		const { getByText } = render(
			<button onClick={ onClick } onKeyUp={ ( event ) => event.preventDefault() }>
				button
			</button>
		);
		const button = getByText( 'button' );
		expect( onClick ).not.toHaveBeenCalled();
		press.Space( button );
		expect( onClick ).not.toHaveBeenCalled();
	} );

	it( 'should submit form when pressing enter on form input', () => {
		const onSubmit = jest.fn();
		const { getByLabelText } = render(
			<form onSubmit={ onSubmit }>
				form
				<input type="hidden" />
				<input type="text" aria-label="input" />
			</form>
		);
		const input = getByLabelText( 'input' );
		expect( onSubmit ).not.toHaveBeenCalled();
		press.Enter( input );
		expect( onSubmit ).toHaveBeenCalled();
	} );

	it( 'should not submit form when pressing enter on form input with multiple text fields', () => {
		const onSubmit = jest.fn();
		const { getByLabelText } = render(
			<form onSubmit={ onSubmit }>
				form
				<input type="hidden" />
				<input type="text" />
				<input type="text" aria-label="input" />
			</form>
		);
		const input = getByLabelText( 'input' );
		press.Enter( input );
		expect( onSubmit ).not.toHaveBeenCalled();
	} );

	it( 'should submit form when pressing enter on form input with multiple text fields with submit button', () => {
		const onSubmit = jest.fn();
		const { getByLabelText } = render(
			<form onSubmit={ onSubmit }>
				form
				<input type="hidden" />
				<input type="text" />
				<input type="text" aria-label="input" />
				<input type="submit" />
			</form>
		);
		const input = getByLabelText( 'input' );
		expect( onSubmit ).not.toHaveBeenCalled();
		press.Enter( input );
		expect( onSubmit ).toHaveBeenCalled();
	} );

	it( 'should move focus when pressing tab', () => {
		const { getByText } = render(
			<>
				<button>button1</button>
				<span>span</span>
				<button>button2</button>
			</>
		);
		const button1 = getByText( 'button1' );
		const button2 = getByText( 'button2' );

		expect( button1 ).not.toHaveFocus();
		press.Tab();
		expect( button1 ).toHaveFocus();
		press.Tab();
		expect( button2 ).toHaveFocus();
		press.Tab();
		expect( button1 ).toHaveFocus();
		press.ShiftTab();
		expect( button2 ).toHaveFocus();
		press.ShiftTab();
		expect( button1 ).toHaveFocus();
	} );

	it( 'should not move focus when pressing tab if event.preventDefault() was called on key down', () => {
		const { getByText } = render(
			<>
				<button>button1</button>
				<span>span</span>
				<button onKeyDown={ ( event ) => event.preventDefault() }>button2</button>
			</>
		);
		const button1 = getByText( 'button1' );
		const button2 = getByText( 'button2' );

		expect( button1 ).not.toHaveFocus();
		press.Tab();
		expect( button1 ).toHaveFocus();
		press.Tab();
		expect( button2 ).toHaveFocus();
		press.Tab();
		expect( button2 ).toHaveFocus();
		press.ShiftTab();
		expect( button2 ).toHaveFocus();
	} );
} );
