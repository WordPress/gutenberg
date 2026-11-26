import { signal } from '@preact/signals';
import { hydrate, render } from 'preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../directives';
import { getRegionRootFragment } from '../hydration';
import { getEvaluate } from '../hooks';
import {
	getContext,
	getScope,
	resetScope,
	setScope,
	type Scope,
} from '../scopes';
import { store } from '../store';
import { afterNextFrame, withScope } from '../utils';
import { toVdom } from '../vdom';

/** Number used to keep the test stores independent. */
let namespaceCount = 0;

/**
 * Waits for the runtime's deferred effects to settle.
 *
 * @return Promise resolving after three animation-frame turns.
 */
async function nextFrames() {
	for ( let i = 0; i < 3; i++ ) {
		await afterNextFrame( () => undefined );
	}
}

function createScope(): Scope {
	return {
		evaluate: () => undefined,
		context: {},
		serverContext: {},
		ref: { current: null },
		attributes: {},
	};
}

describe( 'getEvaluate', () => {
	afterEach( () => {
		while ( getScope() ) {
			resetScope();
		}
	} );

	it.each( [ false, true ] )(
		'propagates a function error and restores the caller scope (scoped: %s)',
		( scoped ) => {
			const scope = createScope();
			const caller = scoped ? createScope() : undefined;
			const error = new Error( 'Function failed' );
			const namespace = `test/evaluate-function-${ scoped }`;
			store( namespace, {
				state: {
					fail() {
						expect( getScope() ).toBe( scope );
						throw error;
					},
				},
			} );
			if ( caller ) {
				setScope( caller );
			}
			const evaluate = getEvaluate( { scope } );
			const fail = evaluate( {
				value: 'state.fail',
				namespace,
				suffix: null,
				uniqueId: null,
			} );
			expect( getScope() ).toBe( caller );
			expect( fail ).toThrow( error );
			expect( getScope() ).toBe( caller );
		}
	);
} );

describe( 'data-wp-watch cleanups', () => {
	it( 'lets a withScope-wrapped cleanup read its element context', async () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', true );

		const namespace = `test/watch-cleanup-scope-${ ++namespaceCount }`;
		const source = signal( 0 );
		const context = { name: 'element-y' };
		const cleanupContexts: unknown[] = [];
		store( namespace, {
			callbacks: {
				watch() {
					void source.value;
					return withScope( () =>
						cleanupContexts.push( getContext( namespace ) )
					);
				},
			},
		} );

		const container = document.createElement( 'div' );
		container.innerHTML = `<div data-wp-interactive="${ namespace }" data-wp-context='{"name":"element-y"}' data-wp-watch="callbacks.watch"></div>`;
		document.body.appendChild( container );
		const element = container.firstElementChild!;
		const fragment = getRegionRootFragment( element );
		hydrate( toVdom( element ), fragment );
		await nextFrames();

		source.value++;
		await nextFrames();

		expect( cleanupContexts ).toEqual( [ context ] );

		render( null, fragment );
		await nextFrames();
		expect( cleanupContexts ).toEqual( [ context, context ] );
	} );
} );
