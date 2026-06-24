/**
 * Internal dependencies
 */
import { getEvaluate, splitStatements } from '../hooks';
import { store } from '../store';
import { resetScope } from '../scopes';
import { resetNamespace } from '../namespaces';

describe( 'Interactivity API', () => {
	describe( 'splitStatements', () => {
		it( 'should return null for empty strings', () => {
			expect( splitStatements( '' ) ).toBeNull();
		} );

		it( 'should return null for strings without semicolons', () => {
			expect( splitStatements( 'abc' ) ).toBeNull();
			expect( splitStatements( 'context.isPinned' ) ).toBeNull();
			expect(
				splitStatements( 'context.currentUserId !== context.authorId' )
			).toBeNull();
		} );

		it( 'should split simple semicolon-delimited statements', () => {
			expect( splitStatements( 'a; b' ) ).toEqual( [ 'a', ' b' ] );
			expect( splitStatements( 'foo; bar; baz' ) ).toEqual( [
				'foo',
				' bar',
				' baz',
			] );
		} );

		it( 'should not split on semicolons inside single-quoted strings', () => {
			expect( splitStatements( "'a;b'; c" ) ).toEqual( [
				"'a;b'",
				' c',
			] );
		} );

		it( 'should not split on semicolons inside double-quoted strings', () => {
			expect( splitStatements( '"a;b"; c' ) ).toEqual( [
				'"a;b"',
				' c',
			] );
		} );

		it( 'should not split on semicolons inside template literals', () => {
			expect( splitStatements( '`a;b`; c' ) ).toEqual( [
				'`a;b`',
				' c',
			] );
		} );

		it( 'should not split on semicolons inside regex literals', () => {
			expect( splitStatements( '/a;b/; c' ) ).toEqual( [
				'/a;b/',
				' c',
			] );
		} );

		it( 'should handle mixed string types with semicolons', () => {
			expect(
				splitStatements(
					"const msg = 'hello; world'; console.log( msg ); msg.length"
				)
			).toEqual( [
				"const msg = 'hello; world'",
				' console.log( msg )',
				' msg.length',
			] );
		} );

		it( 'should return null when called with a non-string', () => {
			// splitStatements returns null early for non-string types
			// because it checks typeof expr !== "string"
			expect( splitStatements( null as unknown as string ) ).toBeNull();
			expect(
				splitStatements( undefined as unknown as string )
			).toBeNull();
		} );

		it( 'should not split on semicolons inside IIFEs', () => {
			expect(
				splitStatements(
					'a; (() => { const x = 1; return x; })(); b'
				)
			).toEqual( [
				'a',
				' (() => { const x = 1; return x; })()',
				' b',
			] );
		} );

		it( 'should handle escaped quotes inside strings', () => {
			expect(
				splitStatements( '"a\\"b;c"; d' )
			).toEqual( [
				'"a\\"b;c"',
				' d',
			] );
			expect(
				splitStatements( "'a\\'b;c'; d" )
			).toEqual( [
				"'a\\'b;c'",
				' d',
			] );
		} );

		it( 'should handle escaped quotes inside template literals', () => {
			expect(
				splitStatements( '`a\\`b;c`; d' )
			).toEqual( [
				'`a\\`b;c`',
				' d',
			] );
		} );

		it( 'should handle expression-like content with division not mistaken for regex', () => {
			// a/2 is division, not the start of a regex literal.
			expect( splitStatements( 'a/2; b' ) ).toEqual( [
				'a/2',
				' b',
			] );
			// a/b/g could be regex /b/g or division a/b/g, but there is
			// no closing '/', so it falls through to [^;] matching.
			expect( splitStatements( 'a/b/g; c' ) ).toEqual( [
				'a/b/g',
				' c',
			] );
		} );

		it( 'should handle empty trailing statements', () => {
			// Trailing empty segments after `;` are not captured by the regex
			// because they contain no characters. The expression `a;` yields
			// only `['a']`.
			expect( splitStatements( 'a;' ) ).toEqual( [ 'a' ] );
		} );

		it( 'should handle leading and trailing whitespace around statements', () => {
			// Outer `trim()` removes leading/trailing whitespace first,
			// then the regex splits on `;`.
			expect( splitStatements( '  a  ;  b  ' ) ).toEqual( [
				'a  ',
				'  b',
			] );
		} );
	} );

	describe( 'getEvaluate - full-expression path', () => {
		let testNamespace: string;
		let testScope: any;
		let namespaceIndex = 0;

		beforeEach( () => {
			testNamespace = `test-${ namespaceIndex++ }`;
			testScope = {
				evaluate: () => {},
				context: {
					[ testNamespace ]: {
						currentUserId: 8,
						authorId: 6,
						isPinned: true,
						count: 5,
						x: true,
						y: false,
						n: 42,
						emptyArray: [],
						emptyObject: {},
						zeroString: '0',
						emptyString: '',
						nullish: null,
						c: true,
						d: false,
					},
				},
				serverContext: {},
				ref: { current: null },
				attributes: {},
			};

			store( testNamespace, {
				state: {
					count: 5,
					name: 'bob',
					flag: true,
					isPinned: true,
					zero: 0,
					stringNumber: '5',
					emptyArray: [],
					emptyObject: {},
					zeroString: '0',
					emptyString: '',
					nullish: null,
					items: [
						{ name: 'a', active: true },
						{ name: 'b', active: false },
						{ name: 'c', active: true },
					],
					a: 6,
					b: 3,
					shift: 1,
				},
				actions: {
					increment: () => {},
				},
				callbacks: {
					noop: () => {},
				},
			} );
		} );

		afterEach( () => {
			// Ensure scope is always reset after each test.
			try {
				resetScope();
			} catch ( _ ) {}
			try {
				resetNamespace();
			} catch ( _ ) {}
		} );

		const evaluateExpr = ( expr: string ) => {
			const evaluate = getEvaluate( { scope: testScope } );
			return evaluate( {
				value: expr,
				namespace: testNamespace,
				suffix: null,
				uniqueId: null,
			} as any );
		};

		it( 'should evaluate context comparisons with !==', () => {
			const result = evaluateExpr(
				'context.currentUserId !== context.authorId'
			);
			expect( result ).toBe( true );
		} );

		it( 'should evaluate context comparisons with ===', () => {
			const result = evaluateExpr(
				'context.currentUserId === context.authorId'
			);
			expect( result ).toBe( false );
		} );

		it( 'should evaluate ternary expressions with state', () => {
			const result = evaluateExpr( 'state.count > 0 ? "yes" : "no"' );
			expect( result ).toBe( 'yes' );
		} );

		it( 'should evaluate negation with ! operator', () => {
			const result = evaluateExpr( '! context.isPinned' );
			expect( result ).toBe( false );
		} );

		it( 'should evaluate logical AND (&&)', () => {
			const result = evaluateExpr(
				'context.currentUserId !== context.authorId && context.isPinned'
			);
			expect( result ).toBe( true );
		} );

		it( 'should evaluate logical OR (||)', () => {
			const result = evaluateExpr(
				'context.currentUserId === context.authorId || context.isPinned'
			);
			expect( result ).toBe( true );
		} );

		it( 'should evaluate array filter expressions', () => {
			const result = evaluateExpr(
				'state.items.filter( i => i.active ).length'
			);
			expect( result ).toBe( 2 );
		} );

		it( 'should handle multi-statement: last value wins', () => {
			const result = evaluateExpr( 'context.count; context.isPinned' );
			// Last statement (context.isPinned) should be the return value.
			expect( result ).toBe( true );
		} );

		it( 'should handle multi-statement with assignment', () => {
			const result = evaluateExpr(
				'context.temp = context.currentUserId; context.temp !== context.authorId'
			);
			expect( result ).toBe( true );
			expect( testScope.context[ testNamespace ].temp ).toBe( 8 );
		} );

		it( 'should allow direct state mutation without getContext/getState helpers', () => {
			const result = evaluateExpr( 'state.count += 1; state.count' );
			expect( result ).toBe( 6 );
			expect( store( testNamespace ).state.count ).toBe( 6 );
		} );

		it( 'should allow direct context mutation without getContext helpers', () => {
			const result = evaluateExpr(
				'context.currentUserId = context.authorId; context.currentUserId === context.authorId'
			);
			expect( result ).toBe( true );
			expect( testScope.context[ testNamespace ].currentUserId ).toBe( 6 );
		} );

		it( 'should return undefined for invalid expressions', () => {
			const result = evaluateExpr( 'state.undefinedProperty.nested' );
			expect( result ).toBeUndefined();
		} );

		it( 'should resolve simple dotted paths via fast path (backward compat)', () => {
			// Simple dotted paths like state.count should use the fast path
			// (resolve()) and return the expected value.
			const result = evaluateExpr( 'state.count' );
			expect( result ).toBe( 5 );
		} );

		it( 'should resolve negated simple paths via full-expression path', () => {
			// Simple paths starting with ! fall through to the full-expression
			// path where ! is handled naturally in the JS expression.
			const result = evaluateExpr( '! context.isPinned' );
			expect( result ).toBe( false );
		} );

		it( 'should support complex boolean precedence and grouping', () => {
			const result = evaluateExpr(
				'context.currentUserId === 8 && context.authorId != 9 || state.count > 10'
			);
			expect( result ).toBe( true );
			expect(
				evaluateExpr( '(context.x || context.y) && (context.c || context.d)' )
			).toBe( true );
			expect(
				evaluateExpr( '(context.x || context.y) && (context.d && context.y)' )
			).toBe( false );
		} );

		it( 'should support nested ternaries', () => {
			expect(
				evaluateExpr( 'state.count > 10 ? "big" : state.flag ? "mid" : "small"' )
			).toBe( 'mid' );
		} );

		it( 'should support bitwise, shift, exponentiation and unary bitwise not', () => {
			expect( evaluateExpr( 'state.a & state.b' ) ).toBe( 2 );
			expect( evaluateExpr( 'state.a | state.b' ) ).toBe( 7 );
			expect( evaluateExpr( 'state.a ^ state.b' ) ).toBe( 5 );
			expect( evaluateExpr( '~state.a' ) ).toBe( -7 );
			expect( evaluateExpr( 'state.a << state.shift' ) ).toBe( 12 );
			expect( evaluateExpr( 'state.a >> state.shift' ) ).toBe( 3 );
			expect( evaluateExpr( 'state.count ** 2' ) ).toBe( 25 );
		} );

		it( 'should follow JS truthiness for empty arrays, empty objects, and the string 0', () => {
			expect( evaluateExpr( 'state.emptyArray ? "yes" : "no"' ) ).toBe( 'yes' );
			expect( evaluateExpr( 'state.emptyObject ? "yes" : "no"' ) ).toBe( 'yes' );
			expect( evaluateExpr( 'state.zeroString ? "yes" : "no"' ) ).toBe( 'yes' );
			expect( evaluateExpr( 'state.emptyString ? "yes" : "no"' ) ).toBe( 'no' );
			expect( evaluateExpr( '!state.emptyArray' ) ).toBe( false );
			expect( evaluateExpr( '!state.zeroString' ) ).toBe( false );
			expect( evaluateExpr( 'state.emptyArray && state.flag' ) ).toBe( true );
			expect( evaluateExpr( 'state.emptyArray || state.flag' ) ).toEqual( [] );
			expect( evaluateExpr( 'state.zeroString && state.flag' ) ).toBe( true );
		} );

		it( 'should follow JS loose vs strict equality semantics for primitive coercion', () => {
			expect( evaluateExpr( 'state.stringNumber == state.count' ) ).toBe( true );
			expect( evaluateExpr( 'state.stringNumber === state.count' ) ).toBe( false );
			expect( evaluateExpr( 'state.emptyString == 0' ) ).toBe( true );
			expect( evaluateExpr( 'state.nullish == false' ) ).toBe( false );
			expect( evaluateExpr( 'state.missing == null' ) ).toBe( true );
			expect( evaluateExpr( 'state.missing === null' ) ).toBe( false );
			expect( evaluateExpr( 'typeof state.missing === "undefined"' ) ).toBe( true );
		} );

		it( 'should treat zero and empty string as valid left operands for ??', () => {
			expect( evaluateExpr( 'state.zero ?? 7' ) ).toBe( 0 );
			expect( evaluateExpr( 'state.emptyString ?? "fallback"' ) ).toBe( '' );
			expect( evaluateExpr( 'state.nullish ?? "fallback"' ) ).toBe( 'fallback' );
		} );

		it( 'should concatenate strings with + using JS semantics', () => {
			expect( evaluateExpr( 'state.name + context.n' ) ).toBe( 'bob42' );
			expect( evaluateExpr( 'state.zeroString + context.n' ) ).toBe( '042' );
		} );
	} );
} );
