import styled from '@emotion/styled';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';

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

	it( 'preserves standard props without relying on the DOM', () => {
		const view = renderToString(
			createElement( Component, {
				as: 'form',
				acceptCharset: 'utf-8',
			} as Parameters< typeof Component >[ 0 ] & {
				acceptCharset: string;
			} )
		);

		expect( view ).toContain( 'accept-charset="utf-8"' );
	} );

	it( 'preserves SVG props for SVG intrinsic elements', () => {
		render(
			<Component
				as="svg"
				data-testid="svg"
				fill="currentColor"
				preserveAspectRatio="xMidYMid meet"
				stroke="none"
				strokeWidth={ 2 }
				viewBox="0 0 24 24"
			/>
		);

		const svg = screen.getByTestId( 'svg' );

		expect( svg ).toHaveAttribute( 'fill', 'currentColor' );
		expect( svg ).toHaveAttribute( 'preserveAspectRatio', 'xMidYMid meet' );
		expect( svg ).toHaveAttribute( 'stroke', 'none' );
		expect( svg ).toHaveAttribute( 'stroke-width', '2' );
		expect( svg ).toHaveAttribute( 'viewBox', '0 0 24 24' );
	} );

	it( 'preserves SVG props without relying on the DOM', () => {
		const view = renderToString(
			<Component
				as="svg"
				fill="currentColor"
				strokeWidth={ 2 }
				viewBox="0 0 24 24"
			/>
		);

		expect( view ).toContain( 'fill="currentColor"' );
		expect( view ).toContain( 'stroke-width="2"' );
		expect( view ).toContain( 'viewBox="0 0 24 24"' );
	} );

	it( 'preserves SVG props for non-SVG-root intrinsic elements', () => {
		render(
			<svg>
				<Component
					as="path"
					d="M0 0h24v24H0z"
					data-testid="path"
					fillRule="evenodd"
					clipPath="url(#clip)"
				/>
			</svg>
		);

		const path = screen.getByTestId( 'path' );

		expect( path ).toHaveAttribute( 'clip-path', 'url(#clip)' );
		expect( path ).toHaveAttribute( 'd', 'M0 0h24v24H0z' );
		expect( path ).toHaveAttribute( 'fill-rule', 'evenodd' );
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

describe( 'PolymorphicElement prop filtering', () => {
	it( 'filters invalid on-prefixed props from intrinsic elements', () => {
		render(
			createElement( PolymorphicElement, {
				'data-testid': 'element',
				on1: 'invalid',
				'on-foo': 'invalid',
			} as Parameters< typeof PolymorphicElement >[ 0 ] & {
				on1: string;
				'on-foo': string;
			} )
		);

		const element = screen.getByTestId( 'element' );

		expect( element ).not.toHaveAttribute( 'on1' );
		expect( element ).not.toHaveAttribute( 'on-foo' );
	} );

	it( 'filters SVG-only props from HTML intrinsic elements', () => {
		render(
			createElement( PolymorphicElement, {
				'data-testid': 'element',
				fill: 'currentColor',
				strokeWidth: 2,
			} as Parameters< typeof PolymorphicElement >[ 0 ] & {
				fill: string;
				strokeWidth: number;
			} )
		);

		const element = screen.getByTestId( 'element' );

		expect( element ).not.toHaveAttribute( 'fill' );
		expect( element ).not.toHaveAttribute( 'stroke-width' );
	} );
} );
