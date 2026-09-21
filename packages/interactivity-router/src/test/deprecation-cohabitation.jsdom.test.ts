/**
 * Row 16 — the deprecated `state.navigation` surface is unaffected by the
 * new `navigating`/`initiator` keys.
 *
 * This is a separate file, like `initiator-invalid-warning.ts`, because
 * `warn()`'s dedupe set (`packages/interactivity/src/utils.ts`) is
 * module-level: a warning triggered once in a shared file makes a later
 * count in that same file read zero.
 *
 * Counting how many times the `state.navigation` getter itself runs can't
 * be done by counting `console.warn` calls, because `warn()` dedupes
 * `console.warn` internally while still being *called* every time the
 * getter runs — so this file wraps `warn` (sourced through `privateApis`)
 * in its own counter, which counts invocations of `warn`, not of
 * `console.warn`.
 */

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
	vi,
	type Mock,
} from 'vitest';

vi.mock( import( '@wordpress/interactivity' ), async () => {
	const real = await import( './__fixtures__/interactivity-shim' );
	const warnCallCounter = { count: 0 };
	return {
		...real,
		privateApis: ( lock: string ) => {
			const apis = real.privateApis( lock );
			return {
				...apis,
				warn: ( message: string ) => {
					warnCallCounter.count++;
					return apis.warn( message );
				},
			};
		},
		__warnCallCounter: warnCallCounter,
	};
} );

async function advanceOneFrame() {
	await vi.advanceTimersByTimeAsync( 100 );
}

describe( 'the deprecated state.navigation surface is unaffected by the new keys', () => {
	beforeEach( () => {
		vi.useFakeTimers( { shouldAdvanceTime: true } );
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	test( 'a full new-key navigation cycle emits zero deprecation warnings and invokes the getter zero times; reading the deprecated surface still warns exactly once and reflects the loading-animation behaviour', async () => {
		const { __warnCallCounter } = ( await import(
			'@wordpress/interactivity'
		) ) as unknown as {
			__warnCallCounter: { count: number };
		};
		const { state, actions } = await import( '../index' );

		__warnCallCounter.count = 0;

		await actions.navigate( 'http://localhost/row16-dest', {
			html: '<!doctype html><title>t</title><body>dest</body>',
			loadingAnimation: true,
			screenReaderAnnouncement: false,
		} );
		await advanceOneFrame();

		// Sanity: this was a real cycle on the new keys.
		expect( state.navigating ).toBe( false );

		// Clause 1: the deprecated getter was never invoked over the cycle.
		expect( __warnCallCounter.count ).toBe( 0 );

		// Clause 2: reading the deprecated surface still warns exactly once
		// with today's verbatim message, and still reflects the
		// loading-animation behaviour that ran during the cycle above.
		const hasStarted = state.navigation.hasStarted;
		const hasFinished = state.navigation.hasFinished;
		// A second read must not add a second console.warn call — warn()'s
		// own dedupe covers that, asserted below via the raw call count.
		void state.navigation.hasStarted;

		expect( hasStarted ).toBe( false );
		expect( hasFinished ).toBe( true );
		expect( console ).toHaveWarnedWith(
			'The usage of state.navigation.{hasStarted|hasFinished} from core/router is deprecated and will stop working in WordPress 7.1.'
		);
		// eslint-disable-next-line no-console
		expect( ( console.warn as Mock ).mock.calls.length ).toBe( 1 );
	} );
} );
