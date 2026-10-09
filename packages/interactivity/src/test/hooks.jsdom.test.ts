import { afterEach, describe, expect, it } from 'vitest';
import { getEvaluate } from '../hooks';
import { getScope, resetScope, setScope, type Scope } from '../scopes';
import { store } from '../store';

/**
 * Creates a directive scope for evaluating store paths.
 *
 * @return An independent scope with empty context and element metadata.
 */
function createScope(): Scope {
	return {
		// Evaluator installed by the directive component.
		evaluate: () => undefined,
		// Client context indexed by store namespace.
		context: {},
		// Server context indexed by store namespace.
		serverContext: {},
		// Element reference owned by this scope.
		ref: { current: null },
		// Original attributes of the scoped element.
		attributes: {},
	};
}

describe( 'getEvaluate', () => {
	afterEach( () => {
		// Clean up the caller frame and any frames leaked by a regression.
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
				// Function values resolved by the evaluator.
				state: {
					/** Throws an error from inside the directive scope. */
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
				// Store function path to resolve without invoking it.
				value: 'state.fail',
				// Namespace containing the function.
				namespace,
				// Default directive spelling.
				suffix: null,
				// No unique directive identifier.
				uniqueId: null,
			} );
			expect( getScope() ).toBe( caller );
			expect( fail ).toThrow( error );
			expect( getScope() ).toBe( caller );
		}
	);
} );
