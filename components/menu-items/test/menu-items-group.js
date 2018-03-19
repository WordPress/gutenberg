/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { MenuItemsGroup } from '../menu-items-group';

describe( 'MenuItemsGroup', () => {
	test( 'should render null when no children provided', () => {
		const wrapper = shallow( <MenuItemsGroup /> );

		expect( wrapper.html() ).toBe( null );
	} );

	test( 'should match snapshot', () => {
		const wrapper = shallow(
			<MenuItemsGroup
				label="My group"
				instanceId="1"
			>
				<p>My item</p>
			</MenuItemsGroup>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
