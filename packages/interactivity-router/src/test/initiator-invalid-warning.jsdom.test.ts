/**
 * The `initiator` option's declared values, exercised from inside a router
 * region, covering the declared values that this suite can distinguish. The
 * omitted-value derivation has its own dedicated suite.
 *
 * Warning-count assertions live in their own file: `warn()`'s dedupe set
 * (`packages/interactivity/src/utils.ts`) is module-level, so a second
 * count in a file that already triggered it would read zero.
 */

import { beforeAll, describe, expect, test, vi } from 'vitest';
import { hydrate } from 'preact';
import { store, privateApis } from '@wordpress/interactivity';
vi.mock(
	import( '@wordpress/interactivity' ),
	async () => await import( './__fixtures__/interactivity-shim' )
);

const CONSENT =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';
const { getRegionRootFragment, toVdom } = privateApis( CONSENT );

// This file hydrates a real data-wp-on--click trigger, whose handler calls
// performance.measure() (packages/interactivity/src/directives/on.ts:183),
// which jsdom does not implement.
beforeAll( () => {
	window.performance.measure = vi.fn();
} );

/**
 * Hydrates a `[data-wp-router-region]` with a real `data-wp-on--click`
 * trigger, so a call made through `runInScope()` runs from a genuine
 * ambient directive scope inside the region — the construction the row
 * requires, and the one that remains meaningful when derivation is exercised
 * by the companion suite.
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

describe( 'the initiator option — declared values, exercised in-region', () => {
	test( 'a nonempty string reports verbatim; null suppresses attribution; empty and invalid values report null and warn exactly once, all from inside region-x', async () => {
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

		// Empty-string arm: reports null and never derives the enclosing region's
		// id. Its warning is deduped with the non-string invalid arm below.
		await region.runInScope( () =>
			actions.navigate( 'http://localhost/row5-empty', {
				initiator: '',
				html: '<!doctype html><title>t</title><body>a</body>',
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBeNull();

		// Invalid arm: a non-string, non-null, non-undefined value. Reports
		// null and shares the one warning emission with the empty-string arm.
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
			'The `initiator` option of `actions.navigate()` must be a nonempty string or null. Ignoring the value.'
		);
	} );
} );
