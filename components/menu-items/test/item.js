/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import MenuItemsItem from '../item';

describe( 'MenuItemsItem', () => {
	test( 'should match snapshot when only label provided', () => {
		const wrapper = shallow(
			<MenuItemsItem
				label="My item"
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	test( 'should match snapshot when all props provided', () => {
		const wrapper = shallow(
			<MenuItemsItem
				className="my-class"
				icon="wordpress"
				isSelected={ true }
				label="My item"
				onClick={ () => {} }
				shortcut="mod+shift+alt+w"
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
