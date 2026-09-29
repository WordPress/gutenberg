import { aroundEach, beforeAll, beforeEach, expect, vi } from 'vitest';

const supportedMatchers = {
	error: 'toHaveErrored',
	info: 'toHaveInformed',
	log: 'toHaveLogged',
	warn: 'toHaveWarned',
};

const callStates = new WeakMap();

function createErrorMessage( state, spyInfo ) {
	const { spy, pass, calls, matcherName, methodName, expected } = spyInfo;
	const hint = pass ? `.not${ matcherName }` : matcherName;
	const message = pass
		? `Expected mock function not to be called but it was called with:\n${ calls.map(
				state.utils.printReceived
			) }`
		: `Expected mock function to be called${
				expected
					? ` with:\n${ state.utils.printExpected( expected ) }\n`
					: '.'
			}\nbut it was called with:\n${ calls.map(
				state.utils.printReceived
			) }`;

	return () =>
		`${ state.utils.matcherHint( hint, spy.getMockName() ) }` +
		'\n\n' +
		message +
		'\n\n' +
		`console.${ methodName }() should not be used unless explicitly expected.`;
}

function createSpyInfo( state, spy, matcherName, methodName, expected ) {
	const calls = spy.mock.calls;
	const matchingCalls = expected
		? calls.filter( ( call ) => state.equals( call, expected ) )
		: calls;
	const pass = matchingCalls.length > 0;

	// Match all observed duplicates, without consuming the mock's history or
	// allowing a negative assertion to account for unrelated calls.
	if ( pass && ! state.isNot ) {
		const callState = callStates.get( spy );
		matchingCalls.forEach( ( call ) =>
			callState?.expectedCalls.add( call )
		);
	}

	return {
		pass,
		message: createErrorMessage( state, {
			spy,
			pass,
			calls,
			matcherName,
			methodName,
			expected,
		} ),
	};
}

expect.extend(
	Object.entries( supportedMatchers ).reduce(
		( result, [ methodName, matcherName ] ) => {
			const matcherNameWith = `${ matcherName }With`;

			return {
				...result,
				[ matcherName ]( received ) {
					const spy = received[ methodName ];
					return createSpyInfo(
						this,
						spy,
						`.${ matcherName }`,
						methodName
					);
				},
				[ matcherNameWith ]( received, ...expected ) {
					const spy = received[ methodName ];
					return createSpyInfo(
						this,
						spy,
						`.${ matcherNameWith }`,
						methodName,
						expected
					);
				},
			};
		},
		{}
	)
);

function createConsoleSpy( methodName ) {
	const spy = vi.fn().mockName( `console.${ methodName }` );
	const callState = { expectedCalls: new Set(), clearedCalls: [] };
	callStates.set( spy, callState );
	const mockClear = spy.mockClear;
	spy.mockClear = () => {
		// mockReset, mockRestore and the vi.*AllMocks helpers also use
		// mockClear. Preserve calls they would otherwise erase.
		callState.clearedCalls.push(
			...spy.mock.calls.filter(
				( call ) => ! callState.expectedCalls.has( call )
			)
		);
		return mockClear();
	};
	return spy;
}

function setConsoleMethodSpy( [ methodName ] ) {
	let spy;

	function resetSpy() {
		// eslint-disable-next-line no-console
		if ( console[ methodName ] !== spy ) {
			spy = createConsoleSpy( methodName );
			// eslint-disable-next-line no-console
			console[ methodName ] = spy;
		}
		const callState = callStates.get( spy );

		spy.mockReset();
		spy.mockImplementation( () => undefined );
		callState.expectedCalls.clear();
		callState.clearedCalls = [];
	}

	function assertExpectedCalls() {
		const callState = callStates.get( spy );
		const unexpectedCalls = [
			...callState.clearedCalls,
			...spy.mock.calls.filter(
				( call ) => ! callState.expectedCalls.has( call )
			),
		];
		if ( unexpectedCalls.length > 0 ) {
			expect(
				unexpectedCalls,
				`console.${ methodName }() should not be used unless explicitly expected.`
			).toEqual( [] );
		}
	}

	beforeAll( resetSpy );
	beforeEach( () => {
		try {
			assertExpectedCalls();
		} finally {
			resetSpy();
		}
	} );
	aroundEach( async ( runTest ) => {
		try {
			await runTest();
		} finally {
			try {
				assertExpectedCalls();
			} finally {
				// A failing check must not leak its calls into the next test.
				resetSpy();
			}
		}
	} );
}

Object.entries( supportedMatchers ).forEach( setConsoleMethodSpy );
