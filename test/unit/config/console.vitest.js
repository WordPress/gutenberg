import { afterEach, beforeAll, beforeEach, expect, vi } from 'vitest';

const supportedMatchers = {
	error: 'toHaveErrored',
	info: 'toHaveInformed',
	log: 'toHaveLogged',
	warn: 'toHaveWarned',
};

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
		`console.${ methodName }() should not be used unless explicitly expected\n` +
		'See https://www.npmjs.com/package/@wordpress/jest-console for details.';
}

function createSpyInfo( state, spy, matcherName, methodName, expected ) {
	const calls = spy.mock.calls;
	const pass = expected
		? calls.some( ( call ) => state.equals( call, expected ) )
		: calls.length > 0;

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
					const spyInfo = createSpyInfo(
						this,
						spy,
						`.${ matcherName }`,
						methodName
					);
					spy.assertionsNumber += 1;
					return spyInfo;
				},
				[ matcherNameWith ]( received, ...expected ) {
					const spy = received[ methodName ];
					const spyInfo = createSpyInfo(
						this,
						spy,
						`.${ matcherNameWith }`,
						methodName,
						expected
					);
					spy.assertionsNumber += 1;
					return spyInfo;
				},
			};
		},
		{}
	)
);

function setConsoleMethodSpy( [ methodName, matcherName ] ) {
	const spy = vi
		.spyOn( console, methodName )
		.mockName( `console.${ methodName }` );

	function resetSpy() {
		spy.mockReset();
		spy.mockImplementation( () => undefined );
		spy.assertionsNumber = 0;
	}

	function assertExpectedCalls() {
		if ( spy.assertionsNumber === 0 && spy.mock.calls.length > 0 ) {
			expect( console ).not[ matcherName ]();
		}
	}

	beforeAll( resetSpy );
	beforeEach( () => {
		assertExpectedCalls();
		resetSpy();
	} );
	afterEach( assertExpectedCalls );
}

Object.entries( supportedMatchers ).forEach( setConsoleMethodSpy );
