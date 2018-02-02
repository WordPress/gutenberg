/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import ifPropsVerify from '../';

describe( 'ifPropsVerify', () => {
	const predicate = props => props.testReturn;
	it( 'should return the component if the predicate returns true', () => {
		const Component = ifPropsVerify( predicate )( () => <div>ok</div> );
		const wrapper = shallow(
			<Component testReturn />
		);
		expect( wrapper.html() ).toBe( '<div>ok</div>' );
	} );

	it( 'should not render if the predicate returns false', () => {
		const Component = ifPropsVerify( predicate )( () => <div>ok</div> );
		const wrapper = shallow(
			<Component />
		);
		expect( wrapper.isEmptyRender() ).toBe( true );
	} );
} );
