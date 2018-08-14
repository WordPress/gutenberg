/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostExcerpt } from '../';
import { addFilter } from '@wordpress/hooks';

describe( 'PostExcerpt', () => {
	it( 'should allow filtering of the excerpt label', () => {
		addFilter( 'editor.post-excerpt.label', 'test', () => 'Filtered Label' );
		const wrapper = shallow( <PostExcerpt /> );
		const control = wrapper.childAt( 0 );
		expect( control.prop( 'label') ).toBe( 'Filtered Label' );
	} );

	it( 'should allow filtering of the excerpt link text', () => {
		addFilter( 'editor.post-excerpt.link-text', 'test', () => 'Filtered Link Text' );
		const excerpt = shallow( <PostExcerpt /> );
		const link = excerpt.childAt( 1 );
		expect( link.text() ).toBe( 'Filtered Link Text' );
	} );
} );
