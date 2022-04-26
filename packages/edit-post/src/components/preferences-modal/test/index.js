/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import EditPostPreferencesModal from '../';

// This allows us to tweak the returned value on each test.
jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/compose/src/hooks/use-viewport-match', () => jest.fn() );

describe( 'EditPostPreferencesModal', () => {
	describe( 'should match snapshot when the modal is active', () => {
		it( 'large viewports', () => {
			useSelect.mockImplementation( () => ( { isModalActive: true } ) );
			useViewportMatch.mockImplementation( () => true );
			const wrapper = shallow( <EditPostPreferencesModal /> );
			expect( wrapper ).toMatchSnapshot();
		} );
		it( 'small viewports', () => {
			useSelect.mockImplementation( () => ( { isModalActive: true } ) );
			useViewportMatch.mockImplementation( () => false );
			const wrapper = shallow( <EditPostPreferencesModal /> );
			expect( wrapper ).toMatchSnapshot();
		} );
	} );

	it( 'should not render when the modal is not active', () => {
		useSelect.mockImplementation( () => ( { isModalActive: false } ) );
		const wrapper = shallow( <EditPostPreferencesModal /> );
		expect( wrapper.isEmptyRender() ).toBe( true );
	} );
} );
