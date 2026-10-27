import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import Listener from '../listener';

describe( 'Listener', () => {
	const createHandler = () => ( { handleEvent: vi.fn() } );

	let listener: Listener;
	let _addEventListener: typeof window.addEventListener;
	let _removeEventListener: typeof window.removeEventListener;
	beforeAll( () => {
		_addEventListener = window.addEventListener;
		_removeEventListener = window.removeEventListener;
		window.addEventListener = vi.fn();
		window.removeEventListener = vi.fn();
	} );

	beforeEach( () => {
		listener = new Listener();
		vi.clearAllMocks();
	} );

	afterAll( () => {
		window.addEventListener = _addEventListener;
		window.removeEventListener = _removeEventListener;
	} );

	describe( '#add()', () => {
		it( 'adds an event listener on first listener', () => {
			listener.add( 'resize', createHandler() );

			expect( window.addEventListener ).toHaveBeenCalledWith(
				'resize',
				expect.any( Function )
			);
		} );

		it( 'does not add event listener on subsequent listeners', () => {
			listener.add( 'resize', createHandler() );
			listener.add( 'resize', createHandler() );

			expect( window.addEventListener ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( '#remove()', () => {
		it( 'removes an event listener on last listener', () => {
			const handler = createHandler();
			listener.add( 'resize', handler );
			listener.remove( 'resize', handler );

			expect( window.removeEventListener ).toHaveBeenCalledWith(
				'resize',
				expect.any( Function )
			);
		} );

		it( 'does not remove event listener on remaining listeners', () => {
			const firstHandler = createHandler();
			const secondHandler = createHandler();
			listener.add( 'resize', firstHandler );
			listener.add( 'resize', secondHandler );
			listener.remove( 'resize', firstHandler );

			expect( window.removeEventListener ).not.toHaveBeenCalled();
		} );
	} );

	describe( '#handleEvent()', () => {
		it( 'calls concerned listeners', () => {
			const handler = createHandler();
			listener.add( 'resize', handler );

			const event = { type: 'resize' } as Event;

			listener.handleEvent( event );

			expect( handler.handleEvent ).toHaveBeenCalledWith( event );
		} );

		it( 'calls all added handlers', () => {
			const handler = createHandler();
			listener.add( 'resize', handler );
			listener.add( 'resize', handler );
			listener.add( 'resize', handler );

			const event = { type: 'resize' } as Event;

			listener.handleEvent( event );

			expect( handler.handleEvent ).toHaveBeenCalledTimes( 3 );
		} );
	} );
} );
