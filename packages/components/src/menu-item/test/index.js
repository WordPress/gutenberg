/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { more } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { MenuItem } from '../';

describe( 'MenuItem', () => {
	it( 'should match snapshot when only label provided', () => {
		const wrapper = shallow( <MenuItem>My item</MenuItem> );

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should match snapshot when all props provided', () => {
		const wrapper = shallow(
			<MenuItem
				className="my-class"
				icon={ more }
				isSelected={ true }
				role="menuitemcheckbox"
				onClick={ noop }
				shortcut="mod+shift+alt+w"
			>
				My item
			</MenuItem>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should match snapshot when isSelected and role are optionally provided', () => {
		const wrapper = shallow(
			<MenuItem
				className="my-class"
				icon={ more }
				onClick={ noop }
				shortcut="mod+shift+alt+w"
			>
				My item
			</MenuItem>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should match snapshot when info is provided', () => {
		const wrapper = shallow(
			<MenuItem info="Extended description of My Item">My item</MenuItem>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should avoid using aria-label if only has non-string children', () => {
		const wrapper = shallow(
			<MenuItem>
				<div />
			</MenuItem>
		);

		expect( wrapper.prop( 'aria-label' ) ).toBeUndefined();
	} );

	it( 'should avoid using aria-checked if only menuitem is set as aria-role', () => {
		const wrapper = shallow(
			<MenuItem role="menuitem" isSelected={ true }>
				<div />
			</MenuItem>
		);

		expect( wrapper.prop( 'aria-checked' ) ).toBeUndefined();
	} );

	it( 'should use aria-checked if menuitemradio or menuitemcheckbox is set as aria-role', () => {
		let wrapper = shallow(
			<MenuItem role="menuitemradio" isSelected={ true }>
				<div />
			</MenuItem>
		);

		expect( wrapper.prop( 'aria-checked' ) ).toBe( true );

		wrapper = shallow(
			<MenuItem role="menuitemcheckbox" isSelected={ true }>
				<div />
			</MenuItem>
		);

		expect( wrapper.prop( 'aria-checked' ) ).toBe( true );
	} );
} );
