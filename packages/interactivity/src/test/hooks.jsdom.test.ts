import { afterEach, describe, expect, it } from 'vitest';
import { getEvaluate } from '../hooks';
import { getScope, resetScope, setScope, type Scope } from '../scopes';
import { store } from '../store';

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
