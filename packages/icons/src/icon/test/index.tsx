import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Icon from '..';

describe( 'Icon', () => {
	it( "merges consumer styles with the icon's intrinsic styles", () => {
		render(
			<Icon
				icon={ <svg style={ { fill: 'none', opacity: 0.5 } } /> }
				data-testid="test-icon"
				style={ { marginInlineStart: 4, opacity: 1 } }
			/>
		);

		const icon = screen.getByTestId( 'test-icon' );
		expect( icon ).toHaveStyle( 'fill: none' );
		expect( icon ).toHaveStyle( 'opacity: 1' );
		expect( icon ).toHaveStyle( 'margin-inline-start: 4px' );
	} );
} );
