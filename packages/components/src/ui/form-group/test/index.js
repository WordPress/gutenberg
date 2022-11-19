/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ControlLabel } from '../../control-label';
import { FormGroup, useFormGroupContextId } from '../index';

// @todo: Refactor this after adding next TextInput component.
const TextInput = ( { id: idProp, ...props } ) => {
	const id = useFormGroupContextId( idProp );
	return <input type="text" id={ id } { ...props } />;
};

// We're intentionally using a string literal for the ID to ensure
// the htmlFor and id properties of the label and inputs are bound correctly.
/* eslint-disable no-restricted-syntax */
describe( 'props', () => {
	test( 'should render correctly', () => {
		render(
			<FormGroup id="fname" label="First name">
				<TextInput />
			</FormGroup>
		);

		expect(
			screen.getByRole( 'textbox', { name: 'First name' } )
		).toBeVisible();
	} );

	test( 'should render label without prop correctly', () => {
		render(
			<FormGroup id="fname">
				<ControlLabel htmlFor="fname">First name</ControlLabel>
				<TextInput />
			</FormGroup>
		);

		expect(
			screen.getByRole( 'textbox', { name: 'First name' } )
		).toBeVisible();
	} );

	test( 'should render labelHidden', () => {
		render(
			<FormGroup labelHidden id="fname" label="First name">
				<TextInput />
			</FormGroup>
		);

		expect(
			screen.getByRole( 'textbox', { name: 'First name' } )
		).toBeVisible();
		expect( screen.getByText( 'First name' ) ).toHaveClass(
			'components-visually-hidden'
		);
	} );

	test( 'should render alignLabel', () => {
		const { container } = render(
			<FormGroup alignLabel="right" id="fname" label="First name">
				<TextInput />
			</FormGroup>
		);

		expect( container ).toMatchSnapshot();
	} );

	test( 'should render vertically', () => {
		const { container } = render(
			<FormGroup horizontal={ false } id="fname" label="First name">
				<TextInput />
			</FormGroup>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
/* eslint-enable no-restricted-syntax */
