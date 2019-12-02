/**
 * External dependencies
 */
import * as React from 'react';

/**
 * Internal dependencies
 */
import render from '../render';
import hover from '../hover';

describe( 'hover', () => {
	it( 'should hover button', () => {
		const onMouseOut = jest.fn();
		const onMouseOver = jest.fn();
		const { getByText } = render(
			<>
				{ /* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */ }
				<button onMouseOver={ onMouseOver } onMouseOut={ onMouseOut }>
					button1
				</button>
				<button>button2</button>
			</>
		);
		const button1 = getByText( 'button1' );
		const button2 = getByText( 'button2' );

		expect( onMouseOut ).not.toHaveBeenCalled();
		expect( onMouseOver ).not.toHaveBeenCalled();

		hover( button1 );

		expect( onMouseOut ).not.toHaveBeenCalled();
		expect( onMouseOver ).toHaveBeenCalled();

		hover( button2 );

		expect( onMouseOut ).toHaveBeenCalled();
	} );
} );
