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
		'See file://gutenberg/packages/jest-console/README.md for details.';
};

const createSpyInfo = ( spy, matcherName, methodName, expected ) => {
	const calls = spy.mock.calls;

	const pass = expected
		? calls.some( ( objects ) => expect( objects ).toEqual( expected ) )
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
		calls,
		pass,
		message,
	};
};

const createToHaveBeenCalledMatcher =
	( matcherName, methodName ) => ( received ) => {
		const spy = received[ methodName ];
		const spyInfo = createSpyInfo( spy, matcherName, methodName );

		spy.assertionsNumber += 1;

		return {
			message: spyInfo.message,
			pass: spyInfo.pass,
		};
	};

const createToHaveBeenCalledWith = ( matcherName, methodName ) =>
	function ( received, ...expected ) {
		const spy = received[ methodName ];
		const spyInfo = createSpyInfo( spy, matcherName, methodName, expected );

		spy.assertionsNumber += 1;

		return {
			message: spyInfo.message,
			pass: spyInfo.pass,
		};
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
