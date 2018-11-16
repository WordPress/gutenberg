/**
 * External dependencies
 */
import { create } from 'react-test-renderer';
import Textarea from 'react-autosize-textarea';

/**
 * Internal dependencies
 */
import { PostTextEditor } from '../';

// "Downgrade" ReactAutosizeTextarea to a regular textarea. Assumes aligned
// props interface.
jest.mock( 'react-autosize-textarea', () => ( props ) => <textarea { ...props } /> );

describe( 'PostTextEditor', () => {
	it( 'should render via the prop value', () => {
		const wrapper = create( <PostTextEditor value="Hello World" /> );

		const textarea = wrapper.root.findByType( Textarea );
		expect( textarea.props.value ).toBe( 'Hello World' );
	} );

	it( 'should render via the state value when edits made', () => {
		const onChange = jest.fn();
		const wrapper = create(
			<PostTextEditor
				value="Hello World"
				onChange={ onChange }
			/>
		);

		const textarea = wrapper.root.findByType( Textarea );
		textarea.props.onChange( { target: { value: 'Hello Chicken' } } );

		expect( textarea.props.value ).toBe( 'Hello Chicken' );
		expect( onChange ).toHaveBeenCalledWith( 'Hello Chicken' );
	} );

	it( 'should render via the state value when edits made, even if prop value changes', () => {
		const onChange = jest.fn();
		const wrapper = create(
			<PostTextEditor
				value="Hello World"
				onChange={ onChange }
			/>
		);

		const textarea = wrapper.root.findByType( Textarea );
		textarea.props.onChange( { target: { value: 'Hello Chicken' } } );

		wrapper.update(
			<PostTextEditor
				value="Goodbye World"
				onChange={ onChange }
			/>
		);

		expect( textarea.props.value ).toBe( 'Hello Chicken' );
		expect( onChange ).toHaveBeenCalledWith( 'Hello Chicken' );
	} );

	it( 'should render via the state value when edits made, even if prop value changes and state value empty', () => {
		const onChange = jest.fn();
		const wrapper = create(
			<PostTextEditor
				value="Hello World"
				onChange={ onChange }
			/>
		);

		const textarea = wrapper.root.findByType( Textarea );
		textarea.props.onChange( { target: { value: '' } } );

		wrapper.update(
			<PostTextEditor
				value="Goodbye World"
				onChange={ onChange }
			/>
		);

		expect( textarea.props.value ).toBe( '' );
		expect( onChange ).toHaveBeenCalledWith( '' );
	} );

	it( 'calls onPersist after changes made and user stops editing', () => {
		const onPersist = jest.fn();
		const wrapper = create(
			<PostTextEditor
				value="Hello World"
				onChange={ () => {} }
				onPersist={ onPersist }
			/>
		);

		const textarea = wrapper.root.findByType( Textarea );
		textarea.props.onChange( { target: { value: '' } } );
		textarea.props.onBlur();

		expect( onPersist ).toHaveBeenCalledWith( '' );
	} );

	it( 'does not call onPersist after user stops editing without changes', () => {
		const onPersist = jest.fn();
		const wrapper = create(
			<PostTextEditor
				value="Hello World"
				onChange={ () => {} }
				onPersist={ onPersist }
			/>
		);

		const textarea = wrapper.root.findByType( Textarea );
		textarea.props.onBlur();

		expect( onPersist ).not.toHaveBeenCalled();
	} );

	it( 'resets to prop value after user stops editing', () => {
		// This isn't the most realistic case, since typically we'd assume the
		// parent renderer to pass the value as it had received onPersist. The
		// test here is more an edge case to stress that it's intentionally
		// differentiating between state and prop values.
		const wrapper = create(
			<PostTextEditor
				value="Hello World"
				onChange={ () => {} }
				onPersist={ () => {} }
			/>
		);

		const textarea = wrapper.root.findByType( Textarea );
		textarea.props.onChange( { target: { value: '' } } );

		wrapper.update(
			<PostTextEditor
				value="Goodbye World"
				onChange={ () => {} }
				onPersist={ () => {} }
			/>
		);

		textarea.props.onBlur();

		expect( textarea.props.value ).toBe( 'Goodbye World' );
	} );
} );
