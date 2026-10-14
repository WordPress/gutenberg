import { describe, expect, it, vi } from 'vitest';
import { withIgnoreIMEEvents } from '../with-ignore-ime-events';

// Builds a native-shaped keyboard event, i.e. one that carries `isComposing`
// on the object itself rather than on a `nativeEvent` property.
function nativeEvent( {
	isComposing = false,
	keyCode = 13,
}: { isComposing?: boolean; keyCode?: number } = {} ) {
	return { isComposing, keyCode } as unknown as KeyboardEvent;
}

// Builds a React-shaped synthetic event, which reads `isComposing` from its
// `nativeEvent` but exposes `keyCode` on the synthetic event itself.
function reactEvent( {
	isComposing = false,
	keyCode = 13,
}: { isComposing?: boolean; keyCode?: number } = {} ) {
	return {
		keyCode,
		nativeEvent: { isComposing },
	} as unknown as React.KeyboardEvent;
}

describe( 'withIgnoreIMEEvents', () => {
	it( 'calls the handler for a regular key press', () => {
		const handler = vi.fn();
		withIgnoreIMEEvents( handler )( nativeEvent() );
		expect( handler ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'passes the event through to the handler untouched', () => {
		const handler = vi.fn();
		const event = nativeEvent();
		withIgnoreIMEEvents( handler )( event );
		expect( handler ).toHaveBeenCalledWith( event );
	} );

	it( 'ignores an event fired mid-composition', () => {
		const handler = vi.fn();
		withIgnoreIMEEvents( handler )( nativeEvent( { isComposing: true } ) );
		expect( handler ).not.toHaveBeenCalled();
	} );

	it( 'ignores keyCode 229, which ends a composition in Mac Safari without setting isComposing', () => {
		const handler = vi.fn();
		withIgnoreIMEEvents( handler )( nativeEvent( { keyCode: 229 } ) );
		expect( handler ).not.toHaveBeenCalled();
	} );

	describe( 'React synthetic events', () => {
		it( 'reads isComposing from nativeEvent', () => {
			const handler = vi.fn();
			withIgnoreIMEEvents( handler )(
				reactEvent( { isComposing: true } )
			);
			expect( handler ).not.toHaveBeenCalled();
		} );

		it( 'calls the handler when the composition has finished', () => {
			const handler = vi.fn();
			withIgnoreIMEEvents( handler )( reactEvent() );
			expect( handler ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
