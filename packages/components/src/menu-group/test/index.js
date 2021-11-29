/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import MenuGroup from '../';

describe( 'MenuGroup', () => {
	test( 'should render null when no children provided', () => {
		const wrapper = render( <MenuGroup /> );

		expect( wrapper.container.firstChild ).toBe( null );
	} );

	test( 'should render correctly', () => {
		const wrapper = render(
			<MenuGroup label="My group" instanceId="1">
				<p>My item</p>
			</MenuGroup>
		);
		expect( wrapper.container.firstChild ).toMatchSnapshot();
	} );
} );
