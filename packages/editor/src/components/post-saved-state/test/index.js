/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
		useDispatchWithMap: jest.fn(),
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

jest.mock( '@wordpress/icons/src/icon', () => () => (
	<div data-testid="test-icon" />
) );

describe( 'PostSavedState', () => {
	it( 'should display saving while save in progress, even if not saveable', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: false,
			isNew: true,
			isSaveable: false,
			isSaving: true,
		} ) );

		render( <PostSavedState /> );

		expect( screen.getByText( 'Saving' ) ).toBeVisible();
	} );

	it( 'returns a disabled button if the post is not saveable', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: false,
			isNew: true,
			isSaveable: false,
			isSaving: false,
		} ) );

		render( <PostSavedState /> );

		expect( screen.getByRole( 'button' ) ).toMatchSnapshot();
	} );

	it( 'returns a switch to draft link if the post is published', () => {
		useSelect.mockImplementation( () => ( {
			isPublished: true,
		} ) );

		render( <PostSavedState /> );

		expect( screen.getByRole( 'button' ) ).toMatchSnapshot();
	} );

	it( 'should return Saved text if not new and not dirty', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: false,
			isNew: false,
			isSaveable: true,
			isSaving: false,
		} ) );

		render( <PostSavedState /> );

		const button = screen.getByRole( 'button' );

		expect( within( button ).getByTestId( 'test-icon' ) ).toBeVisible();
		expect( within( button ).getByText( 'Saved' ) ).toBeVisible();
	} );

	it( 'should return Save button if edits to be saved', async () => {
		const user = userEvent.setup();

		useSelect.mockImplementation( () => ( {
			isDirty: true,
			isNew: false,
			isSaveable: true,
			isSaving: false,
		} ) );

		// Simulate the viewport being considered large.
		useViewportMatch.mockImplementation( () => true );

		render( <PostSavedState /> );

		const button = screen.getByRole( 'button' );

		expect( button ).toMatchSnapshot();

		await user.click( button );

		expect( mockSavePost ).toHaveBeenCalled();

		// Regression: Verify the event object is not passed to prop callback.
		expect( mockSavePost.mock.calls[ 0 ] ).toEqual( [] );
	} );
} );
