/**
 * External dependencies
 */
import { render } from 'test/helpers';

/**
 * Internal dependencies
 */
import ListEdit from '../edit';

describe( 'ListEdit component', () => {
	it( 'renders without crashing', () => {
		const screen = render( <ListEdit attributes={ {} } /> );
		expect( screen.container ).toBeTruthy();
	} );
} );
