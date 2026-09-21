/// <reference types="node" />

/**
 * Verifies that programmatic watchers do not inherit directive scopes while
 * preserving the observable behavior of Preact's effects.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { signal } from '@preact/signals';
import { h, render } from 'preact';
import { describe, expect, it, vi } from 'vitest';
import {
	getContext,
	getElement,
	getScope,
	resetScope,
	setScope,
	type Scope,
} from '../scopes';
import { useWatch, watch, withScope } from '../utils';

/**
 * Creates a scope with the fields required by the scope-stack primitives.
 *
 * @return A scope suitable for use as ambient test state.
 */
function createTestScope(): Scope {
	return {
		evaluate: () => undefined,
		context: {},
		serverContext: {},
		ref: { current: null },
		attributes: {},
	};
}

/**
 * Runs a callback with a scope installed and restores the stack afterwards.
 *
 * @param scope    Scope to install while the callback runs.
 * @param callback Callback to execute.
 * @return The callback's return value.
 */
function runWithScope< Result >(
	scope: Scope,
	callback: () => Result
): Result {
	setScope( scope );
	try {
		return callback();
	} finally {
		resetScope();
	}
}

/**
 * Describes an exception thrown by a scope reader for stable comparisons.
 *
 * @param error Exception to describe.
 * @return The exception's constructor and message.
 */
function describeError( error: unknown ) {
	if ( error instanceof Error ) {
		return {
			constructor: error.constructor.name,
			message: error.message,
		};
	}

	return {
		constructor: typeof error,
		message: String( error ),
	};
}

/**
 * Captures the error from a scope reader without interrupting the reading row.
 *
 * @param callback Scope reader to invoke.
 * @return A stable error description, or `undefined` when the reader returns.
 */
function captureError( callback: () => unknown ) {
	try {
		callback();
	} catch ( error ) {
		return describeError( error );
	}
	return undefined;
}

/**
 * Reads the scope and both debug-only scope readers while tracking a signal.
 *
 * @param source       Reactive value that makes the reading an effect dependency.
 * @param source.value Current value read to register the dependency.
 * @return The scope and errors observed by the readers.
 */
function readScopeReaders( source: { value: number } ) {
	void source.value;
	return {
		scope: getScope(),
		contextError: captureError( () => getContext() ),
		elementError: captureError( () => getElement() ),
	};
}

/**
 * Reads a source file relative to this test file.
 *
 * @param file Path relative to the test file's directory.
 * @return The source file contents.
 */
function readSource( file: string ) {
	return readFileSync(
		join( dirname( fileURLToPath( import.meta.url ) ), file ),
		'utf8'
	);
}

describe( 'watch', () => {
	it( 'runs without ambient scope for baseline and directive-action-triggered runs', async () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', true );

		const source = signal( 0 );
		const actingScope = createTestScope();
		const runs: ReturnType< typeof readScopeReaders >[] = [];

		const dispose = runWithScope( actingScope, () =>
			watch( () => {
				runs.push( readScopeReaders( source ) );
			} )
		);

		// A synchronous action invoked by a directive has its scope installed
		// while it writes the signal that triggers the watcher.
		const directiveAction = runWithScope( actingScope, () =>
			withScope( () => {
				source.value += 1;
			} )
		);
		directiveAction();

		const timeoutRun = await new Promise<
			ReturnType< typeof readScopeReaders >
		>( ( resolve ) => {
			setTimeout( () => resolve( readScopeReaders( { value: 0 } ) ), 0 );
		} );

		expect( runs ).toHaveLength( 2 );
		expect( runs.map( ( run ) => run.scope ) ).toEqual( [
			undefined,
			undefined,
		] );
		expect(
			runs.map( ( { contextError, elementError } ) => ( {
				contextError,
				elementError,
			} ) )
		).toEqual(
			[ timeoutRun, timeoutRun ].map(
				( { contextError, elementError } ) => ( {
					contextError,
					elementError,
				} )
			)
		);
		expect( runs[ 0 ].contextError ).toEqual( {
			constructor: 'Error',
			message: expect.stringContaining(
				'Cannot call `getContext()` when there is no scope.'
			),
		} );
		expect( runs[ 0 ].elementError ).toEqual( {
			constructor: 'Error',
			message: expect.stringContaining(
				'Cannot call `getElement()` when there is no scope.'
			),
		} );

		dispose();
	} );

	it( 'restores the caller scope after returns and after a thrown callback', () => {
		const source = signal( 0 );
		const callerScope = createTestScope();
		const thrown = new Error( 'watch callback failed' );
		let dispose: ( () => void ) | undefined;

		setScope( callerScope );
		try {
			dispose = watch( () => {
				const value = source.value;
				if ( value === 1 ) {
					throw thrown;
				}
			} );

			expect( getScope() ).toBe( callerScope );
			let caught: unknown;
			try {
				source.value = 1;
			} catch ( error ) {
				caught = error;
			}
			expect( caught ).toBe( thrown );
		} finally {
			expect( getScope() ).toBe( callerScope );
			dispose?.();
			resetScope();
		}
	} );

	it( 'composes nested watchers without leaking an empty scope', () => {
		const outerSource = signal( 0 );
		const innerSource = signal( 0 );
		const callerScope = createTestScope();
		const observations: Array< {
			name: string;
			scope: Scope | undefined;
		} > = [];
		let innerDispose: ( () => void ) | undefined;
		let outerDispose: ( () => void ) | undefined;

		setScope( callerScope );
		try {
			outerDispose = watch( () => {
				void outerSource.value;
				observations.push( {
					name: 'outer-before',
					scope: getScope(),
				} );

				if ( ! innerDispose ) {
					innerDispose = watch( () => {
						void innerSource.value;
						observations.push( {
							name: 'inner',
							scope: getScope(),
						} );
					} );
				}

				observations.push( { name: 'outer-after', scope: getScope() } );
			} );

			expect( getScope() ).toBe( callerScope );
			outerSource.value += 1;
			innerSource.value += 1;

			expect( observations ).toEqual( [
				{ name: 'outer-before', scope: undefined },
				{ name: 'inner', scope: undefined },
				{ name: 'outer-after', scope: undefined },
				{ name: 'outer-before', scope: undefined },
				{ name: 'outer-after', scope: undefined },
				{ name: 'inner', scope: undefined },
			] );
			expect( getScope() ).toBe( callerScope );
		} finally {
			innerDispose?.();
			outerDispose?.();
			resetScope();
		}
	} );

	it( 'lets a withScope-wrapped callback reinstall its captured scope', () => {
		const source = signal( 0 );
		const capturedScope = createTestScope();
		const actingScope = createTestScope();
		const readings: Array< Scope | undefined > = [];

		const wrapped = runWithScope( capturedScope, () =>
			withScope( () => {
				void source.value;
				readings.push( getScope() );
			} )
		);

		const dispose = runWithScope( actingScope, () => watch( wrapped ) );
		expect( readings ).toEqual( [ capturedScope ] );
		expect( getScope() ).toBeUndefined();

		runWithScope( actingScope, () => {
			source.value += 1;
		} );

		expect( readings ).toEqual( [ capturedScope, capturedScope ] );
		dispose();
	} );

	it( 'preserves synchronous timing, cleanup ordering, and disposal', () => {
		const source = signal( 0 );
		const events: string[] = [];
		const callerScope = createTestScope();

		setScope( callerScope );
		try {
			const dispose = watch( () => {
				const value = source.value;
				events.push( `run:${ value }` );
				return () => events.push( `cleanup:${ value }` );
			} );

			expect( events ).toEqual( [ 'run:0' ] );
			expect( getScope() ).toBe( callerScope );

			source.value = 1;
			expect( events ).toEqual( [ 'run:0', 'cleanup:0', 'run:1' ] );
			expect( getScope() ).toBe( callerScope );

			dispose();
			expect( events ).toEqual( [
				'run:0',
				'cleanup:0',
				'run:1',
				'cleanup:1',
			] );

			source.value = 2;
			expect( events ).toEqual( [
				'run:0',
				'cleanup:0',
				'run:1',
				'cleanup:1',
			] );
		} finally {
			resetScope();
		}
	} );

	it( 'keeps data-wp-watch callbacks scoped', async () => {
		const source = signal( 0 );
		const capturedScope = createTestScope();
		const readings: Array< Scope | undefined > = [];
		const root = document.createElement( 'div' );

		function WatchedComponent() {
			useWatch( () => {
				void source.value;
				readings.push( getScope() );
			} );
			return null;
		}

		vi.useFakeTimers();
		try {
			runWithScope( capturedScope, () => {
				render( h( WatchedComponent, {} ), root );
			} );

			vi.runAllTimers();
			expect( readings ).toEqual( [ capturedScope ] );

			runWithScope( createTestScope(), () => {
				source.value += 1;
			} );
			vi.advanceTimersByTime( 300 );
			await Promise.resolve();
			expect( readings ).toEqual( [ capturedScope, capturedScope ] );
		} finally {
			render( null, root );
			vi.useRealTimers();
		}
	} );

	it( 'exports the scope-isolating wrapper publicly', () => {
		const utilsSource = readSource( '../utils.ts' );
		const entrySource = readSource( '../index.ts' );

		expect( utilsSource ).toContain(
			'useSignalEffect( withScope( callback ) )'
		);

		const utilsExport = entrySource.match(
			/export\s+\{([^}]*)\}\s+from\s+['"]\.\/utils['"]/s
		)?.[ 1 ];

		expect( utilsExport ).toMatch( /\bwatch\b/ );
		expect( entrySource ).not.toMatch(
			/export\s+const\s+watch\s*=\s*effect/
		);
	} );
} );
