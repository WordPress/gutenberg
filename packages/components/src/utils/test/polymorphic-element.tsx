/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createElement, createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PolymorphicElement } from '../polymorphic-element';

describe( 'PolymorphicElement', () => {
	it( 'filters invalid props from intrinsic elements', () => {
		render(
			createElement( PolymorphicElement, {
				as: 'label',
				'data-testid': 'label',
				htmlFor: 'field',
				labelPosition: 'top',
			} as Parameters< typeof PolymorphicElement >[ 0 ] & {
				labelPosition: string;
			} )
		);

		const label = screen.getByTestId( 'label' );

		expect( label ).toHaveAttribute( 'for', 'field' );
		expect( label ).not.toHaveAttribute( 'labelPosition' );
		expect( label ).not.toHaveAttribute( 'labelposition' );
	} );

	it( 'preserves standard props for intrinsic elements', () => {
		render(
			<PolymorphicElement
				aria-label="Notice"
				className="custom-class"
				data-testid="notice"
				style={ { color: 'red' } }
				title="Notice title"
			/>
		);

		const element = screen.getByTestId( 'notice' );

		expect( element ).toHaveAttribute( 'aria-label', 'Notice' );
		expect( element ).toHaveAttribute( 'title', 'Notice title' );
		expect( element ).toHaveClass( 'custom-class' );
		expect( element ).toHaveStyle( { color: 'rgb(255, 0, 0)' } );
	} );

	it( 'passes custom props through to custom components', () => {
		function CustomComponent( {
			variant,
			...props
		}: JSX.IntrinsicElements[ 'section' ] & {
			variant: string;
		} ) {
			return <section data-variant={ variant } { ...props } />;
		}

		render(
			<PolymorphicElement
				as={ CustomComponent }
				data-testid="custom"
				variant="primary"
			/>
		);

		expect( screen.getByTestId( 'custom' ) ).toHaveAttribute(
			'data-variant',
			'primary'
		);
	} );

	it( 'forwards refs to the rendered element', () => {
		const ref = createRef< HTMLButtonElement >();

		render(
			<PolymorphicElement
				as="button"
				data-testid="button"
				ref={ ref }
				type="button"
			/>
		);

		expect( ref.current ).toBe( screen.getByTestId( 'button' ) );
	} );
} );
