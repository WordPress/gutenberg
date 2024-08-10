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

	describe( 'Check typings', () => {
		// eslint-disable-next-line jest/expect-expect
		it( 'should infer the value type from `type` prop', () => {
			const onChangeString: ( value: string ) => void = () => {};
			const onChangeNumber: ( value: number ) => void = () => {};

			// default type is 'text'
			<TextControl onChange={ onChangeString } value="foo" />;
			<TextControl
				// @ts-expect-error: onChange should accept a string
				onChange={ onChangeNumber }
				value="foo"
			/>;
			<TextControl
				onChange={ onChangeString }
				// @ts-expect-error: value should be a string
				value={ 1 }
			/>;

			// explicitly set type to 'text'
			<TextControl type="text" onChange={ onChangeString } value="foo" />;
			<TextControl
				type="text"
				// @ts-expect-error: onChange should accept a string
				onChange={ onChangeNumber }
				value="foo"
			/>;
			<TextControl
				type="text"
				onChange={ onChangeString }
				// @ts-expect-error: value should be a string
				value={ 1 }
			/>;

			// explicitly set type to 'number'
			<TextControl
				type="number"
				onChange={ onChangeNumber }
				value={ 1 }
			/>;

			<TextControl
				type="number"
				onChange={ onChangeNumber }
				// @ts-expect-error: value should be a number
				value="foo"
			/>;

			<TextControl
				type="number"
				// @ts-expect-error: onChange should accept a number
				onChange={ onChangeString }
				value={ 1 }
			/>;
		} );
	} );
} );
