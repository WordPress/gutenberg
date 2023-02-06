/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withGlobalEvents from '../';
import Listener from '../listener';

jest.mock( '../listener', () => {
	const ActualListener = jest.requireActual( '../listener' ).default;

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
	class OriginalComponent extends Component {
		handleResize( event ) {
			this.props.onResize( event );
		}

		render() {
			const { children } = this.props;
			return <div>{ children }</div>;
		}
	}

	beforeAll( () => {
		jest.spyOn( OriginalComponent.prototype, 'handleResize' );
	} );

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders with original component', () => {
		const EnhancedComponent = withGlobalEvents( {
			resize: 'handleResize',
		} )( OriginalComponent );

		render( <EnhancedComponent ref={ () => {} }>Hello</EnhancedComponent> );

		expect( console ).toHaveWarned();
		expect( screen.getByText( 'Hello' ) ).toBeVisible();
	} );

	it( 'binds events from passed object', () => {
		const EnhancedComponent = withGlobalEvents( {
			resize: 'handleResize',
		} )( OriginalComponent );

		render( <EnhancedComponent ref={ () => {} }>Hello</EnhancedComponent> );

		expect( Listener._instance.add ).toHaveBeenCalledWith(
			'resize',
			// If not `undefined`, then we consider handlers were properly bound to the wrapper component.
			expect.any( Object )
		);
	} );

	it( 'handles events', () => {
		const EnhancedComponent = withGlobalEvents( {
			resize: 'handleResize',
		} )( OriginalComponent );
		const onResize = jest.fn();

		render(
			<EnhancedComponent ref={ () => {} } onResize={ onResize }>
				Hello
			</EnhancedComponent>
		);

		const event = { type: 'resize' };

		Listener._instance.handleEvent( event );

		expect( OriginalComponent.prototype.handleResize ).toHaveBeenCalledWith(
			event
		);
		expect( onResize ).toHaveBeenCalledWith( event );
	} );
} );
