/**
 * Internal dependencies
 */
import ModalLinkUI from '../modal';
/**
 * External dependencies
 */
import { shallow } from 'enzyme';

describe( 'LinksUI', () => {
	it( 'LinksUI renders', () => {
		const wrapper = shallow( <ModalLinkUI /> );
		expect( wrapper ).toBeTruthy();
	} );
} );
