/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import MenuItemsToggle from '../toggle';

describe( 'MenuItemsToggle', () => {
	test( 'should match snapshot when only label provided', () => {
		const wrapper = shallow(
			<MenuItemsToggle
				label="My item"
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	test( 'should match snapshot when all props provided', () => {
		const wrapper = shallow(
			<MenuItemsToggle
				isSelected={ true }
				label="My item"
				onClick={ () => {} }
				shortcut="mod+shift+alt+w"
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
