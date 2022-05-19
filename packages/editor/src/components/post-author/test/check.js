/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostAuthorCheck from '../check';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

describe( 'PostAuthorCheck', () => {
	it( 'should not render anything if has no authors', () => {
		useSelect.mockImplementation( () => ( {
			hasAuthors: false,
			hasAssignAuthorAction: true,
		} ) );

		const wrapper = shallow( <PostAuthorCheck>authors</PostAuthorCheck> );
		expect( wrapper.type() ).toBe( null );
	} );

	it( "should not render anything if doesn't have author action", () => {
		useSelect.mockImplementation( () => ( {
			hasAuthors: true,
			hasAssignAuthorAction: false,
		} ) );

		const wrapper = shallow( <PostAuthorCheck>authors</PostAuthorCheck> );
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render control', () => {
		useSelect.mockImplementation( () => ( {
			hasAuthors: true,
			hasAssignAuthorAction: true,
		} ) );

		const wrapper = shallow( <PostAuthorCheck>authors</PostAuthorCheck> );
		expect( wrapper.type() ).not.toBe( null );
	} );
} );
