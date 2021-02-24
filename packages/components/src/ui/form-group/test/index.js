/**
 * External dependencies
 */
import { render } from '@testing-library/react';

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
		const { container } = render(
			<FormGroup id="fname" label="First name">
				<TextInput />
			</FormGroup>
		);

		const label = container.querySelector( 'label' );
		expect( label ).toHaveAttribute( 'for', 'fname' );
		expect( label ).toContainHTML( 'First name' );

		const input = container.querySelector( 'input' );
		expect( input ).toHaveAttribute( 'id', 'fname' );
	} );

	test( 'should render label without prop correctly', () => {
		const { container } = render(
			<FormGroup id="fname">
				<ControlLabel htmlFor="fname">First name</ControlLabel>
				<TextInput />
			</FormGroup>
		);

		const label = container.querySelector( 'label' );
		expect( label ).toHaveAttribute( 'for', 'fname' );
		expect( label ).toContainHTML( 'First name' );
	} );

	test( 'should render labelHidden', () => {
		const { container } = render(
			<FormGroup labelHidden id="fname" label="First name">
				<TextInput />
			</FormGroup>
		);

		const label = container.querySelector( 'label' );
		expect( label ).toContainHTML( 'First name' );
		// @todo: Refactor this after adding next VisuallyHidden.
		expect( label ).toHaveClass( 'components-visually-hidden' );
	} );

	test( 'should render alignLabel', () => {
		const { container } = render(
			<FormGroup alignLabel="right" id="fname" label="First name">
				<TextInput />
			</FormGroup>
		);

		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render vertically', () => {
		const { container } = render(
			<FormGroup horizontal={ false } id="fname" label="First name">
				<TextInput />
			</FormGroup>
		);

		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
/* eslint-enable no-restricted-syntax */
