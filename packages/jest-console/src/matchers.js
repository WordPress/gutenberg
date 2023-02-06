/**
 * External dependencies
 */
import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils';

/**
 * Internal dependencies
 */
import supportedMatchers from './supported-matchers';

const createToHaveBeenCalledMatcher =
	( matcherName, methodName ) => ( received ) => {
		const spy = received[ methodName ];
		const calls = spy.mock.calls;
		const pass = calls.length > 0;
		const message = pass
			? () =>
					matcherHint( `.not${ matcherName }`, spy.getMockName() ) +
					'\n\n' +
					'Expected mock function not to be called but it was called with:\n' +
					calls.map( printReceived )
			: () =>
					matcherHint( matcherName, spy.getMockName() ) +
					'\n\n' +
					'Expected mock function to be called.';

		spy.assertionsNumber += 1;

		return {
			message,
			pass,
		};
	};

const createToHaveBeenCalledWith = ( matcherName, methodName ) =>
	function ( received, ...expected ) {
		const spy = received[ methodName ];
		const calls = spy.mock.calls;
		const pass = calls.some( ( objects ) =>
			this.equals( objects, expected )
		);
		const message = pass
			? () =>
					matcherHint( `.not${ matcherName }`, spy.getMockName() ) +
					'\n\n' +
					'Expected mock function not to be called with:\n' +
					printExpected( expected )
			: () =>
					matcherHint( matcherName, spy.getMockName() ) +
					'\n\n' +
					'Expected mock function to be called with:\n' +
					printExpected( expected ) +
					'\n' +
					'but it was called with:\n' +
					calls.map( printReceived );

		spy.assertionsNumber += 1;

		return {
			message,
			pass,
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
