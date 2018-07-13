/**
 * External dependencies
 */
import Shallow from 'react-test-renderer/shallow';
import renderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DefaultBlockAppender } from '../';

const shallowRenderer = new Shallow();

function mockNamedComponent( mockName ) {
	class TestComponent extends Component {
		render() {
			return <div id={ 'mock' + mockName } />;
		}
	}
	TestComponent.displayName = 'mock' + mockName;
	return () => <TestComponent />;
}

jest.mock( '../../block-drop-zone', () => mockNamedComponent( 'BlockDropZone' ) );
jest.mock( '../../inserter-with-shortcuts', () => mockNamedComponent( 'InserterWithShortcuts' ) );
jest.mock( '../../inserter', () => mockNamedComponent( 'Inserter' ) );

describe( 'DefaultBlockAppender', () => {
	const expectOnAppendCalled = ( onAppend ) => {
		expect( onAppend ).toHaveBeenCalledTimes( 1 );
		expect( onAppend ).toHaveBeenCalledWith();
	};

	it( 'should render nothing if not visible', () => {
		shallowRenderer.render( <DefaultBlockAppender /> );

		expect( shallowRenderer.getRenderOutput() ).toBe( null );
	} );

	it( 'should match snapshot', () => {
		const onAppend = jest.fn();
		const wrapper = renderer.create( <DefaultBlockAppender isVisible onAppend={ onAppend } showPrompt /> );

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should append a default block when input clicked', () => {
		const onAppend = jest.fn();
		const wrapper = renderer.create( <DefaultBlockAppender isVisible onAppend={ onAppend } showPrompt /> );
		const input = wrapper.root.findByType( 'input' );

		expect( input.props.value ).toEqual( 'Write your story' );
		input.props.onClick();

		expectOnAppendCalled( onAppend );
	} );

	it( 'should append a default block when input focused', () => {
		const onAppend = jest.fn();
		const wrapper = renderer.create( <DefaultBlockAppender isVisible onAppend={ onAppend } showPrompt /> );

		wrapper.root.findByType( 'input' ).props.onFocus();

		expect( wrapper ).toMatchSnapshot();

		expectOnAppendCalled( onAppend );
	} );

	it( 'should optionally show without prompt', () => {
		const onAppend = jest.fn();
		const wrapper = renderer.create( <DefaultBlockAppender isVisible onAppend={ onAppend } showPrompt={ false } /> );
		const input = wrapper.root.findByType( 'input' );

		expect( input.props.value ).toEqual( '' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
