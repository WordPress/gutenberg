/**
 * External dependencies
 */
import { render } from 'test/helpers';

/**
 * Internal dependencies
 */
import { Inserter } from '../index';

const getStylesFromColorScheme = () => {
	return { color: 'white' };
};

describe( 'Inserter', () => {
	it( 'button contains the testID "add-block-button"', () => {
		const screen = render(
			<Inserter getStylesFromColorScheme={ getStylesFromColorScheme } />
		);

		expect( screen.getByTestId( 'add-block-button' ) ).toBeTruthy();
	} );
} );
