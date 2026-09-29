import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component } from '@wordpress/element';
import { logged } from '@wordpress/deprecated';
import withGlobalEvents from '../';
import Listener from '../listener';

vi.mock( import( '../listener' ), async ( importOriginal ) => {
	const { default: ActualListener } = await importOriginal();

	return {
		default: class extends ActualListener {
			constructor() {
				super( ...arguments );

				this.constructor._instance = this;

				vi.spyOn( this, 'add' );
				vi.spyOn( this, 'remove' );
			}
		},
	};
} );

describe( 'withGlobalEvents', () => {
	const DEPRECATION_MESSAGE =
		'wp.compose.withGlobalEvents is deprecated since version 5.7. Please use useEffect instead.';

	class OriginalComponent extends Component {
		handleResize( event ) {
			this.props.onResize( event );
		}

		render() {
			const { children } = this.props;
			return <div>{ children }</div>;
		}
	}

	beforeEach( () => {
		vi.spyOn( OriginalComponent.prototype, 'handleResize' );
		if ( Listener._instance ) {
			vi.spyOn( Listener._instance, 'add' );
			vi.spyOn( Listener._instance, 'remove' );
		}
	} );

	afterEach( () => {
		delete logged[ DEPRECATION_MESSAGE ];
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

		expect( console ).toHaveWarnedWith( DEPRECATION_MESSAGE );
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
		const onResize = vi.fn();

		render(
			<EnhancedComponent ref={ () => {} } onResize={ onResize }>
				Hello
			</EnhancedComponent>
		);
		expect( console ).toHaveWarnedWith( DEPRECATION_MESSAGE );

		const event = { type: 'resize' };

		Listener._instance.handleEvent( event );

		expect( OriginalComponent.prototype.handleResize ).toHaveBeenCalledWith(
			event
		);
		expect( onResize ).toHaveBeenCalledWith( event );
	} );
} );
