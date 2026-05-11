/**
 * External dependencies
 */
import { effect } from '@preact/signals';

/**
 * Internal dependencies
 */
import { proxifyContext, proxifyState, deepMerge } from '../';

describe( 'Interactivity API', () => {
	describe( 'context proxy', () => {
		describe( 'get', () => {
			it( 'should inherit props from its fallback', () => {
				const fallback: any = proxifyContext( { a: 1 }, {} );
				const context: any = proxifyContext( { b: 2 }, fallback );

				expect( context.a ).toBe( 1 );
				expect( context.b ).toBe( 2 );
			} );

			it( "should inherit props from its fallback's fallback", () => {
				const fallback2: any = proxifyContext( { a: 1 }, {} );
				const fallback1: any = proxifyContext( { b: 2 }, fallback2 );
				const context: any = proxifyContext( { c: 3 }, fallback1 );

				expect( context.a ).toBe( 1 );
				expect( context.b ).toBe( 2 );
				expect( context.c ).toBe( 3 );
			} );

			it( 'should list all inherited props', () => {
				const fallback2: any = proxifyContext( { a: 1 }, {} );
				const fallback1: any = proxifyContext( { b: 2 }, fallback2 );
				const context: any = proxifyContext( { c: 3 }, fallback1 );

				expect( Object.entries( context ) ).toEqual( [
					[ 'a', 1 ],
					[ 'b', 2 ],
					[ 'c', 3 ],
				] );
			} );

			it( 'should shadow properties defined in its fallback', () => {
				const fallback: any = proxifyContext(
					{ prop: 'fallback' },
					{}
				);
				const context: any = proxifyContext(
					{ prop: 'context' },
					fallback
				);

				expect( context.prop ).toBe( 'context' );
			} );

			it( 'should not inherit properties from nested objects', () => {
				const fallback: any = proxifyContext( { obj: { a: 1 } }, {} );
				const context: any = proxifyContext(
					{ obj: { b: 2 } },
					fallback
				);

				expect( 'a' in context.obj ).toBe( false );
				expect( context.obj.b ).toBe( 2 );
			} );

			it( 'should work with the proxified state', () => {
				const state = proxifyState( 'test', { a: 1 } );
				const fallback: any = proxifyContext( state, {} );
				const context: any = proxifyContext( state, fallback );

				expect( context.a ).toBe( 1 );
			} );
		} );

		describe( 'set', () => {
			it( 'should modify props defined in it', () => {
				const fallback: any = proxifyContext(
					{ prop: 'fallback' },
					{}
				);
				const context: any = proxifyContext(
					{ prop: 'context' },
					fallback
				);

				context.prop = 'modified';

				expect( context.prop ).toBe( 'modified' );
				expect( fallback.prop ).toBe( 'fallback' );
			} );

			it( 'should modify props inherited from its fallback', () => {
				const fallback: any = proxifyContext(
					{ prop: 'fallback' },
					{}
				);
				const context: any = proxifyContext( {}, fallback );

				context.prop = 'modified';

				expect( context.prop ).toBe( 'modified' );
				expect( fallback.prop ).toBe( 'modified' );
			} );

			it( 'should see changes in inherited props', () => {
				const fallback: any = proxifyContext(
					{ prop: 'fallback' },
					{}
				);
				const context: any = proxifyContext( {}, fallback );

				fallback.prop = 'modified';

				expect( context.prop ).toBe( 'modified' );
				expect( fallback.prop ).toBe( 'modified' );
			} );

			it( 'should create non-inherited props in itself', () => {
				const fallback: any = proxifyContext( {}, {} );
				const context: any = proxifyContext( {}, fallback );

				context.prop = 'modified';

				expect( context.prop ).toBe( 'modified' );
				expect( fallback.prop ).toBeUndefined();
			} );

			it( 'should work with the proxified state', () => {
				const state = proxifyState( 'test', { a: 1 } );
				const fallback: any = proxifyContext( state, {} );
				const context: any = proxifyContext( {}, fallback );

				context.a = 2;

				expect( context.a ).toBe( 2 );
				expect( state.a ).toBe( 2 );
			} );

			it( "should modify props inherited from fallback's ancestors", () => {
				const ancestor: any = proxifyContext(
					{ ancestorProp: 'ancestor' },
					{}
				);
				const fallback: any = proxifyContext(
					{ fallbackProp: 'fallback' },
					ancestor
				);
				const context: any = proxifyContext( {}, fallback );

				context.ancestorProp = 'modified';

				expect( context.ancestorProp ).toBe( 'modified' );
				expect( fallback.ancestorProp ).toBe( 'modified' );
				expect( ancestor.ancestorProp ).toBe( 'modified' );
			} );
		} );

		describe( 'computations', () => {
			it( 'should subscribe to changes in the current context', () => {
				const fallback: any = proxifyContext(
					proxifyState( 'test', { fromFallback: 'fallback' } ),
					{}
				);
				const context: any = proxifyContext(
					proxifyState( 'test', { fromContext: 'context' } ),
					fallback
				);

				const spy = jest.fn( () => context.fromContext );
				effect( spy );

				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( context.fromContext ).toBe( 'context' );

				context.fromContext = 'modified';

				expect( spy ).toHaveBeenCalledTimes( 2 );
				expect( context.fromContext ).toBe( 'modified' );
			} );

			it( 'should subscribe to changes in inherited values', () => {
				const fallback: any = proxifyContext(
					proxifyState( 'test', { fromFallback: 'fallback' } ),
					{}
				);
				const context: any = proxifyContext(
					proxifyState( 'test', { fromContext: 'context' } ),
					fallback
				);

				const spy = jest.fn( () => context.fromFallback );
				effect( spy );

				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( context.fromFallback ).toBe( 'fallback' );

				fallback.fromFallback = 'modified';

				expect( spy ).toHaveBeenCalledTimes( 2 );
				expect( context.fromFallback ).toBe( 'modified' );
			} );

			it( 'should subscribe to undefined props added to the context', () => {
				const fallback: any = proxifyContext(
					proxifyState( 'test', {} ),
					{}
				);
				const context: any = proxifyContext(
					proxifyState( 'test', {} ),
					fallback
				);

				const spy = jest.fn( () => context.fromContext );
				effect( spy );

				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( context.fromContext ).toBeUndefined();

				context.fromContext = 'added';

				expect( spy ).toHaveBeenCalledTimes( 2 );
				expect( context.fromContext ).toBe( 'added' );
			} );

			it( 'should subscribe to undefined props added to the fallback', () => {
				const fallback: any = proxifyContext(
					proxifyState( 'test', {} ),
					{}
				);
				const context: any = proxifyContext(
					proxifyState( 'test', {} ),
					fallback
				);

				const spy = jest.fn( () => context.fromFallback );
				effect( spy );

				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( context.fromFallback ).toBeUndefined();

				fallback.fromFallback = 'added';

				expect( spy ).toHaveBeenCalledTimes( 2 );
				expect( context.fromFallback ).toBe( 'added' );
			} );

			it( 'should subscribe to shadowed props', () => {
				const fallbackState: any = proxifyState( 'test', {} );
				const fallback: any = proxifyContext( fallbackState, {} );

				const contextState: any = proxifyState( 'test', {} );
				const context: any = proxifyContext( contextState, fallback );

				const spy = jest.fn( () => context.prop );
				effect( spy );

				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( context.prop ).toBeUndefined();

				fallbackState.prop = 'fromFallback';

				expect( spy ).toHaveBeenCalledTimes( 2 );
				expect( context.prop ).toBe( 'fromFallback' );

				contextState.prop = 'fromContext';

				expect( spy ).toHaveBeenCalledTimes( 3 );
				expect( context.prop ).toBe( 'fromContext' );
			} );

			it( 'should subscribe to any changes in listed props', () => {
				const fallback: any = proxifyContext(
					proxifyState( 'test', {} ),
					{}
				);
				const context: any = proxifyContext(
					proxifyState( 'test', {} ),
					fallback
				);

				const spy = jest.fn( () => Object.keys( context ) );
				effect( spy );

				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( Object.keys( context ) ).toEqual( [] );

				context.fromContext = 'added';
				fallback.fromFallback = 'added';

				expect( spy ).toHaveBeenCalledTimes( 3 );
				expect( Object.keys( context ).sort() ).toEqual( [
					'fromContext',
					'fromFallback',
				] );
			} );

			it( 'should handle deeply nested properties that are initially undefined', () => {
				const fallback: any = proxifyContext(
					proxifyState( 'test', {} ),
					{}
				);
				const context: any = proxifyContext(
					proxifyState( 'test', {} ),
					fallback
				);

				let deepValue: any;
				const spy = jest.fn( () => {
					deepValue = context.a?.b?.c?.d;
				} );
				effect( spy );

				// Initial call, the deep value is undefined
				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( deepValue ).toBeUndefined();

				// Add a deeply nested object to the context
				context.a = { b: { c: { d: 'test value' } } };

				// The effect should be called again
				expect( spy ).toHaveBeenCalledTimes( 2 );
				expect( deepValue ).toBe( 'test value' );

				// Reading the value directly should also work
				expect( context.a.b.c.d ).toBe( 'test value' );
			} );

			it( 'should handle deeply nested properties that are initially undefined and merged with deepMerge', () => {
				const fallbackState = proxifyState( 'test', {} );
				const fallback: any = proxifyContext( fallbackState, {} );
				const contextState = proxifyState( 'test', {} );
				const context: any = proxifyContext( contextState, fallback );

				let deepValue: any;
				const spy = jest.fn( () => {
					deepValue = context.a?.b?.c?.d;
				} );
				effect( spy );

				// Initial call, the deep value is undefined
				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( deepValue ).toBeUndefined();

				// Use deepMerge to add a deeply nested object to the context
				deepMerge( contextState, {
					a: { b: { c: { d: 'test value' } } },
				} );

				// The effect should be called again
				expect( spy ).toHaveBeenCalledTimes( 2 );
				expect( deepValue ).toBe( 'test value' );

				// Reading the value directly should also work
				expect( context.a.b.c.d ).toBe( 'test value' );
			} );
		} );

		describe( 'proxifyContext', () => {
			it( 'should throw when trying to re-proxify a proxy object', () => {
				const context = proxifyContext( {}, {} );
				expect( () => proxifyContext( context, {} ) ).toThrow(
					'This object cannot be proxified.'
				);
			} );
		} );
	} );
} );
