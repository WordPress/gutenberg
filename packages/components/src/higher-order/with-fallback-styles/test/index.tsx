/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import withFallbackStyles from '..';

describe( 'withFallbackStyles', () => {
	const Wrapped = ( props: { fallbackColor?: string } ) => (
		<div>{ props.fallbackColor ?? 'no-fallback' }</div>
	);

	it( 'derives the fallback styles from the provided node prop', () => {
		const node = document.createElement( 'span' );
		node.dataset.color = 'rgb(1, 2, 3)';
		const mapNodeToProps = jest.fn( ( el: HTMLElement ) => ( {
			fallbackColor: el.dataset.color,
		} ) );
		const Component = withFallbackStyles( mapNodeToProps )( Wrapped );

		render( <Component node={ node } /> );

		// The rendered value proves the actual node was read by mapNodeToProps.
		expect( mapNodeToProps ).toHaveBeenCalledWith(
			node,
			expect.objectContaining( { node } )
		);
		expect( screen.getByText( 'rgb(1, 2, 3)' ) ).toBeInTheDocument();
	} );

	it( 'derives the fallback styles from the internal wrapper node when no node prop is given', () => {
		const mapNodeToProps = jest.fn( ( el: HTMLElement ) => ( {
			fallbackColor: el.tagName.toLowerCase(),
		} ) );
		const Component = withFallbackStyles( mapNodeToProps )( Wrapped );

		render( <Component /> );

		// The HOC wraps in a <div>, so reading the node's tagName yields 'div'.
		expect( mapNodeToProps ).toHaveBeenCalled();
		expect( mapNodeToProps.mock.calls[ 0 ][ 0 ].tagName ).toBe( 'DIV' );
		expect( screen.getByText( 'div' ) ).toBeInTheDocument();
	} );
} );
