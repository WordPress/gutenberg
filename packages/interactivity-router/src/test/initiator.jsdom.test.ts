import { describe, expect, it, beforeEach, vi } from 'vitest';
import { hydrate } from 'preact';
import { act } from 'preact/test-utils';
import { store, privateApis } from '@wordpress/interactivity';
import { parseRegionAttribute, resolveInitiator } from '../initiator';

// `@wordpress/interactivity`'s side effects (hydrateRegions on DOMContentLoaded)
// use the Navigation Timing API to detect whether the page already finished
// loading. jsdom doesn't populate it, so stub it before anything imports that
// package transitively (`../initiator` does, for `getElement`). `vi.hoisted()`
// runs this before the imports above, regardless of where it's written.
vi.hoisted( () => {
	globalThis.performance.getEntriesByType = () =>
		[ { domContentLoadedEventStart: 1 } ] as unknown as ReturnType<
			Performance[ 'getEntriesByType' ]
		>;
} );

const { toVdom } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

let namespaceCount = 0;

function uniqueNamespace(): string {
	return `test/initiator-${ ++namespaceCount }`;
}

describe( 'parseRegionAttribute', () => {
	it( 'parses a plain string region id', () => {
		const el = document.createElement( 'div' );
		el.setAttribute( 'data-wp-router-region', 'my-region' );
		expect( parseRegionAttribute( el ) ).toEqual( { id: 'my-region' } );
	} );

	it( 'parses a JSON object with an id and attachTo', () => {
		const el = document.createElement( 'div' );
		el.setAttribute(
			'data-wp-router-region',
			'{"id":"my-region","attachTo":"body"}'
		);
		expect( parseRegionAttribute( el ) ).toEqual( {
			id: 'my-region',
			attachTo: 'body',
		} );
	} );

	it( 'falls back to the raw value when it is not valid JSON', () => {
		const el = document.createElement( 'div' );
		el.setAttribute( 'data-wp-router-region', 'not-json{' );
		expect( parseRegionAttribute( el ) ).toEqual( { id: 'not-json{' } );
	} );
} );

describe( 'resolveInitiator', () => {
	it( 'returns an explicit string as-is, without detection', () => {
		expect( resolveInitiator( 'explicit-id' ) ).toBe( 'explicit-id' );
	} );

	it( 'returns null when explicitly opted out, without detection', () => {
		expect( resolveInitiator( null ) ).toBeNull();
	} );

	it( 'returns null when there is no active directive scope', () => {
		// No hydration has happened in this test, so there is no scope to
		// detect a region from — this must not throw.
		expect( resolveInitiator( undefined ) ).toBeNull();
	} );

	describe( 'auto-detection from an active scope', () => {
		beforeEach( () => {
			document.body.innerHTML = '';
		} );

		it( 'derives the id of the innermost router region', async () => {
			const namespace = uniqueNamespace();
			let detected: string | null | undefined;

			store( namespace, {
				callbacks: {
					check() {
						detected = resolveInitiator( undefined );
					},
				},
			} );

			const container = document.createElement( 'div' );
			container.innerHTML = `
				<div data-wp-interactive='{ "namespace": "${ namespace }" }' data-wp-router-region="outer-region">
					<div data-wp-router-region="inner-region">
						<span data-wp-init="callbacks.check"></span>
					</div>
				</div>
			`;
			document.body.appendChild( container );
			const region = container.firstElementChild as HTMLElement;

			await act( () => hydrate( toVdom( region ), region.parentNode! ) );

			expect( detected ).toBe( 'inner-region' );
		} );

		it( 'resolves to null when no ancestor is a router region', async () => {
			const namespace = uniqueNamespace();
			let detected: string | null | undefined = 'not set';

			store( namespace, {
				callbacks: {
					check() {
						detected = resolveInitiator( undefined );
					},
				},
			} );

			const container = document.createElement( 'div' );
			container.innerHTML = `
				<div data-wp-interactive='{ "namespace": "${ namespace }" }'>
					<span data-wp-init="callbacks.check"></span>
				</div>
			`;
			document.body.appendChild( container );
			const region = container.firstElementChild as HTMLElement;

			await act( () => hydrate( toVdom( region ), region.parentNode! ) );

			expect( detected ).toBeNull();
		} );
	} );
} );
