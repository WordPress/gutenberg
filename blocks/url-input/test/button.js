/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { shallowToJson } from 'enzyme-to-json';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import UrlInputButton from '../button';

describe( 'UrlInputButton', () => {
	it( 'should has valid class in wrapper tag', () => {
		const wrapper = shallow(<UrlInputButton />)
		expect(wrapper.hasClass('blocks-url-input__button')).toBeTruthy()

	})
	it( 'should not have is-active class if url prop not defined', () => {
		const wrapper = shallow(<UrlInputButton />)
		expect(wrapper.find('IconButton').hasClass('is-active')).toBeFalsy()
	})
	it( 'should have is-active class if url prop defined', () => {
		const wrapper = shallow(<UrlInputButton url="https://example.com" />)
		expect(wrapper.find('IconButton').hasClass('is-active')).toBeTruthy()
	})
	it( 'should hidden form for default', () => {
		const wrapper = shallow(<UrlInputButton />)
		expect(wrapper.find('form').length).toBe(0)
	})
	it( 'should visible form if Edit Link button clicked', () => {
		const wrapper = shallow(<UrlInputButton />)
		wrapper.find('IconButton.components-toolbar__control').simulate('click')
		expect(wrapper.find('form').length).toBe(1)
	})
})
