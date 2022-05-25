/**
 * External dependencies
 */
import { mount, shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostSavedState from '../';

const mockSavePost = jest.fn();

jest.mock( '@wordpress/data/src/components/use-dispatch', () => {
	return {
		useDispatch: () => ( { savePost: mockSavePost } ),
	};
} );

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/compose/src/hooks/use-viewport-match', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

describe( 'PostSavedState', () => {
	it( 'should display saving while save in progress, even if not saveable', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: false,
			isNew: true,
			isSaveable: false,
			isSaving: true,
		} ) );

		const wrapper = mount( <PostSavedState /> );

		expect( wrapper.text() ).toContain( 'Saving' );
	} );

	it( 'returns a disabled button if the post is not saveable', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: false,
			isNew: true,
			isSaveable: false,
			isSaving: false,
		} ) );

		const wrapper = shallow( <PostSavedState /> );

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'returns a switch to draft link if the post is published', () => {
		useSelect.mockImplementation( () => ( {
			isPublished: true,
		} ) );

		const wrapper = shallow( <PostSavedState /> );

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should return Saved text if not new and not dirty', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: false,
			isNew: false,
			isSaveable: true,
			isSaving: false,
		} ) );

		const wrapper = shallow( <PostSavedState /> );

		expect( wrapper.childAt( 0 ).name() ).toBe( 'Icon' );
		expect( wrapper.childAt( 1 ).text() ).toBe( 'Saved' );
	} );

	it( 'should return Save button if edits to be saved', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: true,
			isNew: false,
			isSaveable: true,
			isSaving: false,
		} ) );

		// Simulate the viewport being considered large.
		useViewportMatch.mockImplementation( () => true );

		const wrapper = shallow( <PostSavedState /> );

		expect( wrapper ).toMatchSnapshot();
		wrapper.simulate( 'click', {} );
		expect( mockSavePost ).toHaveBeenCalled();
		// Regression: Verify the event object is not passed to prop callback.
		expect( mockSavePost.mock.calls[ 0 ] ).toEqual( [] );
	} );
} );
