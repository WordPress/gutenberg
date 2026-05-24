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
				data-testid="button-icon"
				icon={ <svg viewBox="-2 -2 24 24" /> }
			/>
		);

		expect( screen.getByTestId( 'button-icon' ) ).toHaveAttribute(
			'viewBox',
			'-2 -2 24 24'
		);
	} );
} );
