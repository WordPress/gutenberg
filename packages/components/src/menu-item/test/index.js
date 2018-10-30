/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { MenuItem } from '../';

jest.mock( '../../button' );

describe( 'MenuItem', () => {
	it( 'should match snapshot when only label provided', () => {
		const wrapper = shallow(
			<MenuItem>
				My item
			</MenuItem>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should match snapshot when all props provided', () => {
		const wrapper = shallow(
			<MenuItem
				className="my-class"
				icon="wordpress"
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
				icon="wordpress"
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
			<MenuItem info="Extended description of My Item" instanceId={ 1 }>
				My item
			</MenuItem>
		);

		expect( wrapper.prop( 'aria-label' ) ).not.toBeUndefined();
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should avoid using aria-label if only has non-string children', () => {
		const wrapper = shallow(
			<MenuItem><div /></MenuItem>
		);

		expect( wrapper.prop( 'aria-label' ) ).toBeUndefined();
	} );
} );
