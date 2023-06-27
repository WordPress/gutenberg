/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import TextControl from '..';

const noop = () => {};

describe( 'TextControl', () => {
	it( 'should generate an ID if not passed as a prop', () => {
		render( <TextControl onChange={ noop } value={ '' } /> );

		expect( screen.getByRole( 'textbox' ) ).toHaveAttribute(
			'id',
			expect.stringMatching( /^inspector-text-control-/ )
		);
	} );

	it( 'should use the passed ID prop if provided', () => {
		const id = 'test-id';
		render( <TextControl onChange={ noop } id={ id } value={ '' } /> );

		expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'id', id );
	} );

	it( 'should map the label and input together when given an ID', () => {
		const id = 'test-id';
		const labelValue = 'Test Label';
		render(
			<TextControl
				onChange={ noop }
				id={ id }
				label={ labelValue }
				value={ '' }
			/>
		);

		const textbox = screen.getByRole( 'textbox' );
		const label = screen.getByText( labelValue );
		expect( textbox ).toHaveAttribute( 'id', label.getAttribute( 'for' ) );
	} );
} );
