/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTextEditor from '../';

// "Downgrade" ReactAutosizeTextarea to a regular textarea. Assumes aligned
// props interface.
jest.mock( 'react-autosize-textarea', () => ( props ) => (
	<textarea { ...props } />
) );

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

let mockEditPost = jest.fn();
let mockResetEditorBlocks = jest.fn();

jest.mock( '@wordpress/data/src/components/use-dispatch', () => {
	return {
		useDispatch: () => ( {
			editPost: mockEditPost,
			resetEditorBlocks: mockResetEditorBlocks,
		} ),
	};
} );

jest.useRealTimers();

describe( 'PostTextEditor', () => {
	beforeEach( () => {
		useSelect.mockImplementation( () => 'Hello World' );

		mockEditPost = jest.fn();
		mockResetEditorBlocks = jest.fn();
	} );

	it( 'should render via the value from useSelect', () => {
		render( <PostTextEditor /> );

		expect( screen.getByLabelText( 'Type text or HTML' ) ).toHaveValue(
			'Hello World'
		);
	} );

	it( 'should render via the state value when edits made', async () => {
		const user = userEvent.setup();
		render( <PostTextEditor /> );

		const textarea = screen.getByLabelText( 'Type text or HTML' );

		await user.clear( textarea );
		await user.type( textarea, 'Hello Chicken' );

		expect( textarea ).toHaveValue( 'Hello Chicken' );
		expect( mockEditPost ).toHaveBeenCalledWith( {
			content: 'Hello Chicken',
		} );
	} );

	it( 'should render via the state value when edits made, even if prop value changes', async () => {
		const user = userEvent.setup();
		const { rerender } = render( <PostTextEditor /> );

		const textarea = screen.getByLabelText( 'Type text or HTML' );

		await user.clear( textarea );
		await user.type( textarea, 'Hello Chicken' );

		useSelect.mockImplementation( () => 'Goodbye World' );

		rerender( <PostTextEditor /> );

		expect( textarea ).toHaveValue( 'Hello Chicken' );
		expect( mockEditPost ).toHaveBeenCalledWith( {
			content: 'Hello Chicken',
		} );
	} );

	it( 'should render via the state value when edits made, even if prop value changes and state value empty', async () => {
		const user = userEvent.setup();
		const { rerender } = render( <PostTextEditor /> );

		const textarea = screen.getByLabelText( 'Type text or HTML' );

		await user.clear( textarea );

		useSelect.mockImplementation( () => 'Goodbye World' );

		rerender( <PostTextEditor /> );

		expect( textarea ).toHaveValue( '' );
		expect( mockEditPost ).toHaveBeenCalledWith( {
			content: '',
		} );
	} );

	it( 'calls onPersist after changes made and user stops editing', async () => {
		const user = userEvent.setup();
		render( <PostTextEditor /> );

		const textarea = screen.getByLabelText( 'Type text or HTML' );

		await user.clear( textarea );

		// Stop editing.
		act( () => {
			textarea.blur();
		} );

		expect( mockResetEditorBlocks ).toHaveBeenCalledWith( [] );
	} );

	it( 'does not call onPersist after user stops editing without changes', () => {
		render( <PostTextEditor /> );

		// Stop editing.
		screen.getByLabelText( 'Type text or HTML' ).blur();

		expect( mockResetEditorBlocks ).not.toHaveBeenCalled();
	} );

	it( 'resets to prop value after user stops editing', async () => {
		// This isn't the most realistic case, since typically we'd assume the
		// parent renderer to pass the value as it had received onPersist. The
		// test here is more an edge case to stress that it's intentionally
		// differentiating between state and prop values.
		const user = userEvent.setup();
		const { rerender } = render( <PostTextEditor /> );

		const textarea = screen.getByLabelText( 'Type text or HTML' );

		await user.clear( textarea );

		useSelect.mockImplementation( () => 'Goodbye World' );

		rerender( <PostTextEditor /> );

		act( () => {
			textarea.blur();
		} );

		expect( textarea ).toHaveValue( 'Goodbye World' );
	} );
} );
