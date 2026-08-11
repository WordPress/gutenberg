import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { image } from '@wordpress/icons';
import BlockIcon from '../';

function getIconWrapper( container ) {
	// The wrapper is intentionally non-semantic.
	return container.firstChild;
}

describe( 'BlockIcon', () => {
	it( 'renders an icon', () => {
		const { container } = render( <BlockIcon icon={ image } /> );

		// The decorative SVG is intentionally hidden from the accessibility tree.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'svg' ) ).toBeInTheDocument();
	} );

	it( 'renders a span without the has-colors classname', () => {
		const { container } = render( <BlockIcon icon={ image } /> );

		expect( getIconWrapper( container ) ).not.toHaveClass( 'has-colors' );
	} );

	it( 'renders a span with the has-colors classname', () => {
		const { container } = render( <BlockIcon icon={ image } showColors /> );

		expect( getIconWrapper( container ) ).toHaveClass( 'has-colors' );
	} );

	it( 'supports adding a className to the wrapper', () => {
		const { container } = render(
			<BlockIcon icon={ image } className="foo-bar" />
		);

		expect( getIconWrapper( container ) ).toHaveClass( 'foo-bar' );
	} );

	it( 'skips adding background and foreground styles when colors are not enabled', () => {
		const { container } = render(
			<BlockIcon
				icon={ {
					background: 'white',
					foreground: 'black',
					src: 'image',
				} }
			/>
		);

		expect( getIconWrapper( container ) ).not.toHaveAttribute( 'style' );
	} );

	it( 'adds background and foreground styles when colors are enabled', () => {
		const { container } = render(
			<BlockIcon
				icon={ {
					background: 'white',
					foreground: 'black',
					src: 'image',
				} }
				showColors
			/>
		);

		const styles = window.getComputedStyle( getIconWrapper( container ) );
		expect( styles.backgroundColor ).toBe( 'rgb(255, 255, 255)' );
		expect( styles.color ).toBe( 'rgb(0, 0, 0)' );
	} );
} );
