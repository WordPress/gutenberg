/**
 * Internal dependencies
 */
import InlineLinkUI from '../inline';
/**
 * External dependencies
 */
import { shallow } from 'enzyme';

describe( 'InlineLinkUI', () => {
	it( 'InlineLinkUI renders', () => {
		const wrapper = shallow( <InlineLinkUI /> );
		expect( wrapper ).toBeTruthy();
	} );
} );
