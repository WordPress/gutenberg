/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createElement, createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PolymorphicElement } from '../polymorphic-element';

const StyledDiv = styled.div``;

const components = [
	{
		name: 'PolymorphicElement',
		Component: PolymorphicElement,
	},
	{
		name: 'styled.div',
		Component: StyledDiv,
	},
] as const;

describe.each( components )( '$name', ( { Component: RawComponent } ) => {
	const Component = RawComponent as typeof PolymorphicElement;

	it( 'filters invalid props from intrinsic elements', () => {
		render(
			createElement( Component, {
				as: 'label',
				'data-testid': 'label',
				htmlFor: 'field',
				labelPosition: 'top',
			} as Parameters< typeof Component >[ 0 ] & {
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
			<Component
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

	it( 'preserves SVG props for SVG intrinsic elements', () => {
		render(
			<Component
				as="svg"
				data-testid="svg"
				preserveAspectRatio="xMidYMid meet"
				viewBox="0 0 24 24"
			/>
		);

		const svg = screen.getByTestId( 'svg' );

		expect( svg ).toHaveAttribute( 'preserveAspectRatio', 'xMidYMid meet' );
		expect( svg ).toHaveAttribute( 'viewBox', '0 0 24 24' );
	} );

	it( 'filters invalid props from SVG intrinsic elements', () => {
		render(
			createElement( Component, {
				as: 'svg',
				'data-testid': 'svg',
				labelPosition: 'top',
				viewBox: '0 0 24 24',
			} as Parameters< typeof Component >[ 0 ] & {
				labelPosition: string;
			} )
		);

		const svg = screen.getByTestId( 'svg' );

		expect( svg ).toHaveAttribute( 'viewBox', '0 0 24 24' );
		expect( svg ).not.toHaveAttribute( 'labelPosition' );
		expect( svg ).not.toHaveAttribute( 'labelposition' );
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
			<Component
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
			<Component
				as="button"
				data-testid="button"
				ref={ ref }
				type="button"
			/>
		);

		expect( ref.current ).toBe( screen.getByTestId( 'button' ) );
	} );
} );
