/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Portal } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		render(
			<>
				<div className="container">
					<Portal>
						<div className="element">
							Code is Poetry - WordPress.org
						</div>
					</Portal>
				</div>
			</>
		);

		// This is because the `div.element` is portal'ed outside of the wrapping `.container`
		expect(
			document.querySelector( 'body .container .element' )
		).toBeFalsy();

		// Instead, it is rendered at the `body` level.
		expect( document.querySelector( 'body .element' ) ).toBeTruthy();
	} );
} );
