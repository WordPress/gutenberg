/**
 * External dependencies
 */
import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils';

/**
 * Internal dependencies
 */
import supportedMatchers from './supported-matchers';
import type { Mock } from 'jest-mock';
import type {
	ExtendedMock,
	MatcherFunction,
	MatcherResult,
	MatcherWithArgsFunction,
} from './types';

interface SpyInfo {
	spy: Mock;
	pass: boolean;
	calls: unknown[][];
	matcherName: string;
	methodName: string;
	expected?: unknown[];
}

const createErrorMessage = ( spyInfo: SpyInfo ) => {
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

const createSpyInfo = (
	spy: Mock,
	matcherName: string,
	methodName: string,
	expected?: unknown[]
) => {
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
	( matcherName: string, methodName: string ) =>
	( received: Record< string, Mock > ): MatcherResult => {
		const spy = received[ methodName ] as ExtendedMock;
		const spyInfo = createSpyInfo( spy, matcherName, methodName );
		spy.assertionsNumber += 1;
		return spyInfo;
	};

const createToHaveBeenCalledWith = (
	matcherName: string,
	methodName: string
) =>
	function (
		received: Record< string, Mock >,
		...expected: unknown[]
	): MatcherResult {
		const spy = received[ methodName ] as ExtendedMock;
		const spyInfo = createSpyInfo( spy, matcherName, methodName, expected );
		spy.assertionsNumber += 1;
		return spyInfo;
	};

type MatchersObject = Record<
	string,
	MatcherFunction | MatcherWithArgsFunction
>;

expect.extend(
	Object.entries( supportedMatchers ).reduce< MatchersObject >(
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
