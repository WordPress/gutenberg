/**
 * External dependencies
 */
import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils';

/**
 * Internal dependencies
 */
import supportedMatchers from './supported-matchers';

const createErrorMessage = ( spyInfo ) => {
	const { spy, pass, calls, matcherName, methodName, expected } = spyInfo;
	const hint = pass ? `.not${ matcherName }` : matcherName;
	const message = pass
		? `Expected mock function not to be called but it was called with:\n${ calls.map(
				printReceived
		  ) }`
		: `Expected mock function to be called${
				expected ? ` with:\n${ printExpected( expected ) }\n` : '.'
		  }\nbut it was called with:\n${ calls.map( printReceived ) }`;

	return () =>
		`${ matcherHint( hint, spy.getMockName() ) }` +
		'\n\n' +
		message +
		'\n\n' +
		`console.${ methodName }() should not be used unless explicitly expected\n` +
		'See https://www.npmjs.com/package/@wordpress/jest-console for details.';
};

const createSpyInfo = ( spy, matcherName, methodName, expected ) => {
	const calls = spy.mock.calls;

	const pass = expected
		? JSON.stringify( calls ).includes( JSON.stringify( expected ) )
		: calls.length > 0;

	const message = createErrorMessage( {
		spy,
		pass,
		calls,
		matcherName,
		methodName,
		expected,
	} );

	return {
		pass,
		message,
	};
};

const createToHaveBeenCalledMatcher =
	( matcherName, methodName ) => ( received ) => {
		const spy = received[ methodName ];
		const spyInfo = createSpyInfo( spy, matcherName, methodName );

		spy.assertionsNumber += 1;

		return spyInfo;
	};

const createToHaveBeenCalledWith = ( matcherName, methodName ) =>
	function ( received, ...expected ) {
		const spy = received[ methodName ];
		const spyInfo = createSpyInfo( spy, matcherName, methodName, expected );

		spy.assertionsNumber += 1;

		return spyInfo;
	};

expect.extend(
	Object.entries( supportedMatchers ).reduce(
		( result, [ methodName, matcherName ] ) => {
			const matcherNameWith = `${ matcherName }With`;

			return {
				...result,
				[ matcherName ]: createToHaveBeenCalledMatcher(
					`.${ matcherName }`,
					methodName
				),
				[ matcherNameWith ]: createToHaveBeenCalledWith(
					`.${ matcherNameWith }`,
					methodName
				),
			};
		},
		{}
	)
);
