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
	describe( 'When no ID prop is provided', () => {
		it( 'should generate an ID', () => {
			render( <TextControl onChange={ noop } value="" /> );

			expect( screen.getByRole( 'textbox' ) ).toHaveAttribute(
				'id',
				expect.stringMatching( /^inspector-text-control-/ )
			);
		} );

		it( 'should be labelled correctly', () => {
			const labelValue = 'Test Label';
			render(
				<TextControl label={ labelValue } onChange={ noop } value="" />
			);

			expect(
				screen.getByRole( 'textbox', { name: labelValue } )
			).toBeVisible();
		} );
	} );

	describe( 'When an ID prop is provided', () => {
		const id = 'test-id';

		it( 'should use the passed ID prop if provided', () => {
			render( <TextControl id={ id } onChange={ noop } value="" /> );

			expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'id', id );
		} );

		it( 'should be labelled correctly', () => {
			const labelValue = 'Test Label';
			render(
				<TextControl
					label={ labelValue }
					id={ id }
					onChange={ noop }
					value=""
				/>
			);

			expect(
				screen.getByRole( 'textbox', { name: labelValue } )
			).toBeVisible();
		} );
	} );
} );
