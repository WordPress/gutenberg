/**
 * Row 5 — the `initiator` option's three declared arms, exercised from
 * inside a router region, narrowed to what can go red at Task 2 (the
 * `declared === undefined` arm derives nothing yet — Task 3 implements the
 * derivation, and states its own red for that arm separately).
 *
 * Warning-count assertions live in their own file: `warn()`'s dedupe set
 * (`packages/interactivity/src/utils.ts`) is module-level, so a second
 * count in a file that already triggered it would read zero.
 */

/**
 * External dependencies
 */
import { hydrate } from 'preact';

/**
 * WordPress dependencies
 */
jest.mock( '@wordpress/interactivity', () =>
	require( './__fixtures__/interactivity-shim' )
);

import { store, privateApis } from '@wordpress/interactivity';

const CONSENT =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';
const { getRegionRootFragment, toVdom } = privateApis( CONSENT );

// This file hydrates a real data-wp-on--click trigger, whose handler calls
// performance.measure() (packages/interactivity/src/directives/on.ts:183),
// which jsdom does not implement (investigation fact 4).
beforeAll( () => {
	window.performance.measure = jest.fn();
} );

/**
 * Hydrates a `[data-wp-router-region]` with a real `data-wp-on--click`
 * trigger, so a call made through `runInScope()` runs from a genuine
 * ambient directive scope inside the region — the construction the row
 * requires, and the one that stays meaningful once Task 3 adds derivation.
 *
 * @param id Router region id — also used as the store namespace, so it must
 *           be unique per test.
 * @return An object exposing `runInScope()`.
 */
function setupRegionTrigger( id: string ) {
	let onClick: () => void = () => undefined;
	store( `test/${ id }`, {
		actions: {
			trigger() {
				onClick();
			},
		},
	} );

	const container = document.createElement( 'div' );
	container.innerHTML =
		`<div data-wp-interactive="test/${ id }" data-wp-router-region="${ id }">` +
		'<button data-wp-on--click="actions.trigger"></button>' +
		'</div>';
	document.body.appendChild( container );
	const regionEl = container.firstElementChild as Element;

	hydrate( toVdom( regionEl ), getRegionRootFragment( regionEl ) );

	const button = regionEl.querySelector( 'button' ) as HTMLButtonElement;

	return {
		runInScope< T >( fn: () => T ): T {
			let result: T;
			onClick = () => {
				result = fn();
			};
			button.click();
			return result!;
		},
	};
}

describe( 'the initiator option — three arms, exercised in-region', () => {
	test( "the string arm reports it verbatim; the null arm reports null; the invalid arm reports null and warns exactly once, all from inside region-x — narrowed to Task 2's in-phase reds", async () => {
		const { actions, state } = await import( '../index' );
		const region = setupRegionTrigger( 'row5' );

		// String arm.
		await region.runInScope( () =>
			actions.navigate( 'http://localhost/row5-string', {
				initiator: 'x',
				html: '<!doctype html><title>t</title><body>a</body>',
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBe( 'x' );

		// null arm.
		await region.runInScope( () =>
			actions.navigate( 'http://localhost/row5-null', {
				initiator: null,
				html: '<!doctype html><title>t</title><body>a</body>',
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBeNull();

		// Invalid arm: a non-string, non-null, non-undefined value. Reports
		// null and warns exactly once with the specified message.
		await region.runInScope( () =>
			actions.navigate( 'http://localhost/row5-invalid', {
				// @ts-expect-error — deliberately invalid for this test.
				initiator: 42,
				html: '<!doctype html><title>t</title><body>a</body>',
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBeNull();
		expect( console ).toHaveWarnedWith(
			'The `initiator` option of `actions.navigate()` must be a string or null. Ignoring the value.'
		);
	} );
} );
