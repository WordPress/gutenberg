/**
 * External dependencies
 */
import { act, create } from 'react-test-renderer';
import Textarea from 'react-autosize-textarea';

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

describe( 'PostTextEditor', () => {
	beforeEach( () => {
		useSelect.mockImplementation( () => 'Hello World' );

		mockEditPost = jest.fn();
		mockResetEditorBlocks = jest.fn();
	} );

	it( 'should render via the value from useSelect', () => {
		let wrapper;

		act( () => {
			wrapper = create( <PostTextEditor /> );
		} );

		const textarea = wrapper.root.findByType( Textarea );
		expect( textarea.props.value ).toBe( 'Hello World' );
	} );

	it( 'should render via the state value when edits made', () => {
		let wrapper;

		act( () => {
			wrapper = create( <PostTextEditor /> );
		} );

		const textarea = wrapper.root.findByType( Textarea );

		act( () =>
			textarea.props.onChange( { target: { value: 'Hello Chicken' } } )
		);

		expect( textarea.props.value ).toBe( 'Hello Chicken' );
		expect( mockEditPost ).toHaveBeenCalledWith( {
			content: 'Hello Chicken',
		} );
	} );

	it( 'should render via the state value when edits made, even if prop value changes', () => {
		let wrapper;

		act( () => {
			wrapper = create( <PostTextEditor /> );
		} );

		const textarea = wrapper.root.findByType( Textarea );

		act( () =>
			textarea.props.onChange( { target: { value: 'Hello Chicken' } } )
		);

		useSelect.mockImplementation( () => 'Goodbye World' );

		act( () => {
			wrapper.update( <PostTextEditor /> );
		} );

		expect( textarea.props.value ).toBe( 'Hello Chicken' );
		expect( mockEditPost ).toHaveBeenCalledWith( {
			content: 'Hello Chicken',
		} );
	} );

	it( 'should render via the state value when edits made, even if prop value changes and state value empty', () => {
		let wrapper;

		act( () => {
			wrapper = create( <PostTextEditor /> );
		} );

		const textarea = wrapper.root.findByType( Textarea );
		act( () => textarea.props.onChange( { target: { value: '' } } ) );

		useSelect.mockImplementation( () => 'Goodbye World' );

		act( () => {
			wrapper.update( <PostTextEditor /> );
		} );

		expect( textarea.props.value ).toBe( '' );
		expect( mockEditPost ).toHaveBeenCalledWith( {
			content: '',
		} );
	} );

	it( 'calls onPersist after changes made and user stops editing', () => {
		let wrapper;

		act( () => {
			wrapper = create( <PostTextEditor /> );
		} );

		const textarea = wrapper.root.findByType( Textarea );

		act( () => textarea.props.onChange( { target: { value: '' } } ) );
		act( () => textarea.props.onBlur() );

		expect( mockResetEditorBlocks ).toHaveBeenCalledWith( [] );
	} );

	it( 'does not call onPersist after user stops editing without changes', () => {
		let wrapper;

		act( () => {
			wrapper = create( <PostTextEditor /> );
		} );

		const textarea = wrapper.root.findByType( Textarea );
		act( () => textarea.props.onBlur() );

		expect( mockResetEditorBlocks ).not.toHaveBeenCalled();
	} );

	it( 'resets to prop value after user stops editing', () => {
		// This isn't the most realistic case, since typically we'd assume the
		// parent renderer to pass the value as it had received onPersist. The
		// test here is more an edge case to stress that it's intentionally
		// differentiating between state and prop values.
		let wrapper;

		act( () => {
			wrapper = create( <PostTextEditor /> );
		} );

		const textarea = wrapper.root.findByType( Textarea );
		act( () => textarea.props.onChange( { target: { value: '' } } ) );

		useSelect.mockImplementation( () => 'Goodbye World' );

		act( () => {
			wrapper.update( <PostTextEditor /> );
		} );

		act( () => textarea.props.onBlur() );

		expect( textarea.props.value ).toBe( 'Goodbye World' );
	} );
} );
