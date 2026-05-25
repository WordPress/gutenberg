import { createRef } from '@wordpress/element';
import { render, screen } from '@testing-library/react';
import { ButtonIcon } from '../icon';

describe( 'Button.Icon', () => {
	it( 'forwards ref', () => {
		const ref = createRef< SVGSVGElement >();

		render( <ButtonIcon ref={ ref } icon={ <svg /> } /> );

		expect( ref.current ).toBeInstanceOf( SVGSVGElement );
	} );

	it( 'preserves the icon viewBox', () => {
		render(
			<ButtonIcon
				aria-label="Button icon"
				role="img"
				icon={ <svg viewBox="-2 -2 24 24" /> }
			/>
		);

		expect( screen.getByRole( 'img', { hidden: true } ) ).toHaveAttribute(
			'viewBox',
			'-2 -2 24 24'
		);
	} );
} );
