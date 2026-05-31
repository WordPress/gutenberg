/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import withFallbackStyles from '..';

describe( 'withFallbackStyles', () => {
	const Wrapped = ( props: { fallbackTextColor?: string } ) => (
		<div>{ props.fallbackTextColor ?? 'no-fallback' }</div>
	);

	it( 'passes the mapped fallback styles down to the wrapped component', () => {
		const mapNodeToProps = jest.fn( () => ( {
			fallbackTextColor: 'rgb(1, 2, 3)',
		} ) );
		const Component = withFallbackStyles( mapNodeToProps )( Wrapped );

		render( <Component /> );

		expect( mapNodeToProps ).toHaveBeenCalled();
		expect( screen.getByText( 'rgb(1, 2, 3)' ) ).toBeInTheDocument();
	} );

	it( 'uses the provided node prop instead of the internal ref wrapper', () => {
		const node = document.createElement( 'div' );
		const mapNodeToProps = jest.fn( () => ( {
			fallbackTextColor: 'rgb(4, 5, 6)',
		} ) );
		const Component = withFallbackStyles( mapNodeToProps )( Wrapped );

		render( <Component node={ node } /> );

		expect( mapNodeToProps ).toHaveBeenCalledWith(
			node,
			expect.objectContaining( { node } )
		);
		expect( screen.getByText( 'rgb(4, 5, 6)' ) ).toBeInTheDocument();
	} );
} );
