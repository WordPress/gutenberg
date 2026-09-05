import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component } from '@wordpress/element';
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
		const onResize = vi.fn();

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
