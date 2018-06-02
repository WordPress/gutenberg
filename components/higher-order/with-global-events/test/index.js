/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * External dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withGlobalEvents from '../';
import Listener from '../listener';

jest.mock( '../listener', () => {
	const ActualListener = require.requireActual( '../listener' ).default;

	return class extends ActualListener {
		constructor() {
			super( ...arguments );

			this.constructor._instance = this;

			jest.spyOn( this, 'add' );
			jest.spyOn( this, 'remove' );
		}
	};
} );

describe( 'withGlobalEvents', () => {
	let wrapper;

	class OriginalComponent extends Component {
		handleResize( event ) {
			this.props.onResize( event );
		}

		render() {
			return <div>{ this.props.children }</div>;
		}
	}

	beforeAll( () => {
		jest.spyOn( OriginalComponent.prototype, 'handleResize' );
	} );

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	afterEach( () => {
		if ( wrapper ) {
			wrapper.unmount();
			wrapper = null;
		}
	} );

	function mountEnhancedComponent( props ) {
		const EnhancedComponent = withGlobalEvents( {
			resize: 'handleResize',
		} )( OriginalComponent );

		wrapper = mount( <EnhancedComponent { ...props }>Hello</EnhancedComponent> );
	}

	it( 'renders with original component', () => {
		mountEnhancedComponent();

		expect( wrapper.childAt( 0 ).childAt( 0 ).type() ).toBe( 'div' );
		expect( wrapper.childAt( 0 ).text() ).toBe( 'Hello' );
	} );

	it( 'binds events from passed object', () => {
		mountEnhancedComponent();

		expect( Listener._instance.add ).toHaveBeenCalledWith( 'resize', wrapper.instance() );
	} );

	it( 'handles events', () => {
		const onResize = jest.fn();

		mountEnhancedComponent( { onResize } );

		const event = { type: 'resize' };

		Listener._instance.handleEvent( event );

		expect( OriginalComponent.prototype.handleResize ).toHaveBeenCalledWith( event );
		expect( onResize ).toHaveBeenCalledWith( event );
	} );
} );
