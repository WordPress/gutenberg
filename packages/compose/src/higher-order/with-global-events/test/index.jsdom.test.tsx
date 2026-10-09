import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component } from '@wordpress/element';
import type { ReactNode } from 'react';
import withGlobalEvents from '../';
import Listener from '../listener';

type TrackedListener = typeof Listener & { _instance?: Listener };

vi.mock( import( '../listener' ), async ( importOriginal ) => {
	const { default: ActualListener } = await importOriginal();

	return {
		default: class extends ActualListener {
			constructor() {
				super();

				( this.constructor as TrackedListener )._instance = this;

				vi.spyOn( this as Listener, 'add' );
				vi.spyOn( this as Listener, 'remove' );
			}
		},
	};
} );

describe( 'withGlobalEvents', () => {
	const DEPRECATION_MESSAGE =
		'wp.compose.withGlobalEvents is deprecated since version 5.7. Please use useEffect instead.';

	class OriginalComponent extends Component< {
		children: ReactNode;
		onResize?: ( event: Event ) => void;
	} > {
		handleResize( event: Event ) {
			this.props.onResize!( event );
		}

		render() {
			const { children } = this.props;
			return <div>{ children }</div>;
		}
	}

	beforeEach( () => {
		vi.spyOn( OriginalComponent.prototype, 'handleResize' );
		const { _instance } = Listener as TrackedListener;
		if ( _instance ) {
			vi.spyOn( _instance, 'add' );
			vi.spyOn( _instance, 'remove' );
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

		expect( console ).toHaveWarnedWith( DEPRECATION_MESSAGE );
		expect(
			( Listener as TrackedListener )._instance!.add
		).toHaveBeenCalledWith(
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

		const event = { type: 'resize' } as Event;

		( Listener as TrackedListener )._instance!.handleEvent( event );

		expect( OriginalComponent.prototype.handleResize ).toHaveBeenCalledWith(
			event
		);
		expect( onResize ).toHaveBeenCalledWith( event );
	} );
} );
