/**
 * Internal dependencies
 */
import subscribeDelegatedListener from '..';

describe( 'subscribeDelegatedListener', () => {
	let root;
	let target;

	beforeEach( () => {
		// Build a nested DOM:
		//   document.body > #outer > #inner > #leaf
		root = document.createElement( 'div' );
		root.id = 'outer';
		const inner = document.createElement( 'div' );
		inner.id = 'inner';
		target = document.createElement( 'span' );
		target.id = 'leaf';
		inner.appendChild( target );
		root.appendChild( inner );
		document.body.appendChild( root );
	} );

	afterEach( () => {
		document.body.removeChild( root );
	} );

	function fire( element, type = 'click', init = { bubbles: true } ) {
		element.dispatchEvent( new Event( type, init ) );
	}

	test( 'invokes element subscriber when event fires on that element', () => {
		const cb = jest.fn();
		subscribeDelegatedListener( target, 'click', cb );
		fire( target );
		expect( cb ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'invokes element subscriber when event fires on a descendant', () => {
		const cb = jest.fn();
		const child = document.createElement( 'b' );
		target.appendChild( child );
		subscribeDelegatedListener( target, 'click', cb );
		fire( child );
		expect( cb ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'does not invoke element subscriber when event fires outside its subtree', () => {
		const cb = jest.fn();
		const sibling = document.createElement( 'div' );
		document.body.appendChild( sibling );
		subscribeDelegatedListener( target, 'click', cb );
		fire( sibling );
		expect( cb ).not.toHaveBeenCalled();
		document.body.removeChild( sibling );
	} );

	test( 'bubble phase: nested subscribers fire inner-to-outer', () => {
		const order = [];
		subscribeDelegatedListener( root, 'click', () =>
			order.push( 'outer' )
		);
		subscribeDelegatedListener( target, 'click', () =>
			order.push( 'leaf' )
		);
		fire( target );
		expect( order ).toEqual( [ 'leaf', 'outer' ] );
	} );

	test( 'capture phase: nested subscribers fire outer-to-inner', () => {
		const order = [];
		subscribeDelegatedListener(
			root,
			'click',
			() => order.push( 'outer' ),
			true
		);
		subscribeDelegatedListener(
			target,
			'click',
			() => order.push( 'leaf' ),
			true
		);
		fire( target );
		expect( order ).toEqual( [ 'outer', 'leaf' ] );
	} );

	test( 'capture and bubble registries are independent', () => {
		const captureCb = jest.fn();
		const bubbleCb = jest.fn();
		subscribeDelegatedListener( target, 'click', captureCb, true );
		subscribeDelegatedListener( target, 'click', bubbleCb, false );
		fire( target );
		expect( captureCb ).toHaveBeenCalledTimes( 1 );
		expect( bubbleCb ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'document subscriber always fires for events in the document', () => {
		const cb = jest.fn();
		subscribeDelegatedListener( document, 'click', cb );
		fire( target );
		expect( cb ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'window subscriber fans out independently of element subscribers', () => {
		const winCb = jest.fn();
		const elCb = jest.fn();
		subscribeDelegatedListener( window, 'resize', winCb );
		subscribeDelegatedListener( target, 'resize', elCb );
		window.dispatchEvent( new Event( 'resize' ) );
		expect( winCb ).toHaveBeenCalledTimes( 1 );
		// Element subscriber doesn't see a resize on window.
		expect( elCb ).not.toHaveBeenCalled();
	} );

	test( 'multiple callbacks for the same element all fire', () => {
		const a = jest.fn();
		const b = jest.fn();
		subscribeDelegatedListener( target, 'click', a );
		subscribeDelegatedListener( target, 'click', b );
		fire( target );
		expect( a ).toHaveBeenCalledTimes( 1 );
		expect( b ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'unsubscribe stops further dispatch', () => {
		const cb = jest.fn();
		const unsub = subscribeDelegatedListener( target, 'click', cb );
		fire( target );
		expect( cb ).toHaveBeenCalledTimes( 1 );
		unsub();
		fire( target );
		expect( cb ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'attaches one native listener per (root, eventType, phase) regardless of subscriber count', () => {
		const spy = jest.spyOn( document, 'addEventListener' );
		// First subscribe attaches the native listener; subsequent ones
		// for the same key share it.
		subscribeDelegatedListener( target, 'mousemove', jest.fn() );
		subscribeDelegatedListener( root, 'mousemove', jest.fn() );
		subscribeDelegatedListener( document, 'mousemove', jest.fn() );
		const nativeMousemoves = spy.mock.calls.filter(
			( [ type, , opts ] ) => type === 'mousemove' && ! opts // bubble-phase only
		).length;
		expect( nativeMousemoves ).toBe( 1 );
		spy.mockRestore();
	} );

	test( 'cross-realm Document/Window: accepts targets from a different realm', () => {
		// Simulate an iframe document — a Document from a different realm
		// would not be `instanceof Document` of the parent realm. Replicate
		// that by passing a duck-typed Document-like object.
		const iframe = document.createElement( 'iframe' );
		document.body.appendChild( iframe );
		const iframeDoc = iframe.contentDocument;
		const iframeTarget = iframeDoc.createElement( 'span' );
		iframeDoc.body.appendChild( iframeTarget );

		const cb = jest.fn();
		expect( () =>
			subscribeDelegatedListener( iframeTarget, 'click', cb )
		).not.toThrow();
		iframeTarget.dispatchEvent(
			new iframe.contentWindow.Event( 'click', { bubbles: true } )
		);
		expect( cb ).toHaveBeenCalledTimes( 1 );
		document.body.removeChild( iframe );
	} );
} );
