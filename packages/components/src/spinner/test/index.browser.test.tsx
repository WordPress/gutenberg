import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { createRef } from '@wordpress/element';
import Spinner from '..';

describe( 'Spinner', () => {
	it( 'preserves the legacy size and class name', async () => {
		await render( <Spinner /> );

		const spinner = screen.getByRole( 'presentation' );
		expect( spinner ).toHaveClass( 'components-spinner' );
		expect( spinner ).toHaveAttribute( 'width', '16' );
		expect( spinner ).toHaveAttribute( 'height', '16' );
		expect( spinner ).toHaveAttribute( 'focusable', 'false' );
	} );

	it( 'preserves SVG prop and style overrides', async () => {
		await render(
			<Spinner
				role="img"
				aria-label="Loading"
				className="custom-spinner"
				width="32"
				height="32"
				style={ { width: 32, height: 32, color: 'red' } }
			/>
		);

		const spinner = screen.getByRole( 'img', { name: 'Loading' } );
		expect( spinner ).toHaveClass( 'components-spinner', 'custom-spinner' );
		expect( spinner ).toHaveAttribute( 'width', '32' );
		expect( spinner ).toHaveAttribute( 'height', '32' );
		expect( spinner ).toHaveStyle( {
			width: '32px',
			height: '32px',
			color: 'rgb(255, 0, 0)',
		} );
	} );

	it( 'forwards the ref to the SVG element', async () => {
		const ref = createRef< SVGSVGElement >();
		await render( <Spinner ref={ ref } /> );

		expect( ref.current ).toBe( screen.getByRole( 'presentation' ) );
		expect( ref.current ).toBeInstanceOf( SVGSVGElement );
	} );
} );
