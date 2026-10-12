/**
 * How `actions.navigate()` resolves `state.initiator`, and how router regions
 * are identified.
 *
 * The router registers global listeners when it loads, so it is imported once
 * and every test in this file shares its `core/router` store. A navigation
 * unmounts every router region missing from the destination, so each test
 * hydrates the regions it needs.
 */

import { describe, expect, test, vi } from 'vitest';
import { privateApis, store, watch, withScope } from '@wordpress/interactivity';
import { actions, state } from '../index';
import {
	hydrateHtml,
	hydrateTrigger,
	nextFrames,
	pageHtml,
	quiet,
} from './fixtures/helpers';

// Fills the jsdom gaps before `@wordpress/interactivity` evaluates.
await vi.hoisted( async () => {
	await import( './fixtures/jsdom-setup' );
} );

const { getScope } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

/**
 * Navigates to a cached page without any router region.
 *
 * @param path    The destination path.
 * @param options Additional `navigate()` options.
 * @return The `navigate()` promise.
 */
const navigateTo = ( path: string, options = {} ) =>
	actions.navigate( `http://localhost${ path }`, {
		...quiet,
		html: pageHtml( path ),
		...options,
	} );

describe( 'the `initiator` option', () => {
	test( 'a nonempty string is used as is and `null` opts out, even inside a region', async () => {
		const trigger = hydrateTrigger( 'declared-region' );

		await trigger.runInScope( () =>
			navigateTo( '/declared', { initiator: 'my-plugin/declared' } )
		);
		expect( state.initiator ).toBe( 'my-plugin/declared' );

		await trigger.runInScope( () =>
			navigateTo( '/suppressed', { initiator: null } )
		);
		expect( state.initiator ).toBeNull();
	} );

	test( 'an empty string or another invalid value resolves to `null` and warns, even inside a region', async () => {
		for ( const initiator of [ '', 42 ] ) {
			const trigger = hydrateTrigger( `invalid-region-${ initiator }` );
			await trigger.runInScope( () =>
				navigateTo( `/invalid-${ initiator }`, { initiator } )
			);
			expect( state.initiator ).toBeNull();
		}
		expect( console ).toHaveWarnedWith(
			'The `initiator` option of `actions.navigate()` must be a nonempty string or null. Ignoring the value.'
		);
	} );
} );

describe( 'the derived initiator', () => {
	test.each( [
		[ 'a plain id', 'plain-id', 'plain-id' ],
		[ 'a JSON object', '{"id":"json-id"}', 'json-id' ],
		[ 'a namespaced id', 'my-plugin::namespaced-id', 'namespaced-id' ],
		[ 'a JSON scalar', '123', '123' ],
		[ 'a malformed JSON object', '{"id":"malformed"', '{"id":"malformed"' ],
		[ 'an empty value', '', null ],
		[ 'a JSON object without id', '{"attachTo":"body"}', null ],
	] )(
		'is the id of the enclosing region declared with %s',
		async ( _, regionAttribute, expected ) => {
			const trigger = hydrateTrigger( regionAttribute );

			await trigger.runInScope( () => navigateTo( '/derived' ) );

			expect( state.initiator ).toBe( expected );
		}
	);

	test( 'is the id of the nearest region when regions are nested', async () => {
		store( 'test/nested', {
			actions: {
				*navigate() {
					yield navigateTo( '/nested' );
				},
			},
		} );
		const outer = hydrateHtml(
			'<div data-wp-interactive="test/nested" data-wp-router-region="outer"><div data-wp-router-region="inner"><button data-wp-on--click="actions.navigate"></button></div></div>'
		);

		outer.querySelector( 'button' )!.click();
		await nextFrames();

		expect( state.initiator ).toBe( 'inner' );
	} );

	test( 'distinguishes two instances of the same block in different regions', async () => {
		for ( const id of [ 'query-1', 'query-2' ] ) {
			const trigger = hydrateTrigger( id );
			await trigger.runInScope( () => navigateTo( `/${ id }` ) );
			expect( state.initiator ).toBe( id );
		}
	} );

	test( 'is the enclosing region of an element that is no longer connected', async () => {
		const trigger = hydrateTrigger( 'detached-region' );
		trigger.element.remove();

		await trigger.runInScope( () => navigateTo( '/detached' ) );

		expect( state.initiator ).toBe( 'detached-region' );
	} );

	test( 'is `null` without a directive scope, outside any region, or when the scope has no element', async () => {
		await navigateTo( '/no-scope' );
		expect( state.initiator ).toBeNull();

		const noRegion = hydrateTrigger( null );
		await noRegion.runInScope( () => navigateTo( '/no-region' ) );
		expect( state.initiator ).toBeNull();

		for ( const current of [ null, document.createTextNode( 'text' ) ] ) {
			const trigger = hydrateTrigger(
				`no-element-${ String( current ) }`
			);
			await trigger.runInScope( () => {
				getScope().ref.current = current as unknown as HTMLElement;
				return navigateTo( '/no-element' );
			} );
			expect( state.initiator ).toBeNull();
		}
	} );

	test( 'is the same region for a second navigation from the same element', async () => {
		const markup =
			'<div data-wp-interactive="test/repeat" data-wp-router-region="repeat"><button data-wp-on--click="actions.navigate"></button></div>';
		store( 'test/repeat', {
			actions: {
				*navigate() {
					yield navigateTo( '/repeat', {
						html: pageHtml( markup ),
						force: true,
					} );
				},
			},
		} );
		hydrateHtml( markup );

		for ( let i = 0; i < 2; i++ ) {
			document
				.querySelector< HTMLElement >(
					'[data-wp-router-region="repeat"] button'
				)!
				.click();
			await nextFrames();
			expect( state.initiator ).toBe( 'repeat' );
		}
	} );
} );

describe( 'the derived initiator of a navigation started by a watcher', () => {
	/**
	 * Watches the start of the next navigation and navigates again from
	 * there.
	 *
	 * @param wrap Wraps the watcher callback, for example with `withScope()`.
	 * @return A function to stop watching.
	 */
	function navigateOnNextStart(
		wrap: ( callback: () => void ) => () => void = ( callback ) => callback
	) {
		let hasStarted = false;
		return watch(
			wrap( () => {
				if ( state.navigating && ! hasStarted ) {
					hasStarted = true;
					void navigateTo( '/from-watcher' );
				}
			} )
		);
	}

	test( 'is `null` for a `watch()` callback', async () => {
		await nextFrames();
		const stop = navigateOnNextStart();

		const trigger = hydrateTrigger( 'watch-trigger' );
		await trigger.runInScope( () => navigateTo( '/watch-trigger' ) );
		await nextFrames();
		stop();

		expect( state.initiator ).toBeNull();
	} );

	test( 'is the captured region for a `watch()` callback wrapped with `withScope()`', async () => {
		await nextFrames();
		const watcherRegion = hydrateTrigger( 'watcher-region' );
		const stop = watcherRegion.runInScope( () =>
			navigateOnNextStart( ( callback ) => withScope( callback ) )
		);

		const trigger = hydrateTrigger( 'trigger-region' );
		await trigger.runInScope( () => navigateTo( '/with-scope-trigger' ) );
		await nextFrames();
		stop();

		expect( state.initiator ).toBe( 'watcher-region' );
	} );

	test( 'is the region of a `data-wp-watch` directive', async () => {
		let hasStarted = false;
		let hasNavigated = false;
		store( 'test/directive-watcher', {
			callbacks: {
				navigateOnEnd() {
					if ( state.navigating ) {
						hasStarted = true;
					} else if ( hasStarted && ! hasNavigated ) {
						hasNavigated = true;
						void navigateTo( '/from-directive' );
					}
				},
			},
		} );
		// The destination keeps the region, so the directive is not unmounted.
		const markup =
			'<div data-wp-interactive="test/directive-watcher" data-wp-router-region="directive-region" data-wp-watch="callbacks.navigateOnEnd"></div>';
		hydrateHtml( markup );

		const trigger = hydrateTrigger( 'directive-trigger-region' );
		await trigger.runInScope( () =>
			navigateTo( '/directive-trigger', { html: pageHtml( markup ) } )
		);
		await nextFrames();

		expect( hasNavigated ).toBe( true );
		expect( state.initiator ).toBe( 'directive-region' );
	} );
} );

describe( 'router regions', () => {
	test( 'are updated when declared with any id form', async () => {
		const ids = [
			'update-plain',
			'{"id":"update-json"}',
			'my-plugin::update-namespaced',
			'901',
			'{"id":"update-malformed"',
			'__proto__',
		];
		const regionMarkup = ( id: string, text: string ) =>
			`<div data-wp-interactive="test/update" data-wp-router-region='${ id }'>${ text }</div>`;
		store( 'test/update', {} );
		const regions = ids.map( ( id ) =>
			hydrateHtml( regionMarkup( id, 'before' ) )
		);

		await navigateTo( '/update', {
			html: pageHtml(
				ids.map( ( id ) => regionMarkup( id, 'after' ) ).join( '' )
			),
		} );

		for ( const region of regions ) {
			expect( region ).toHaveTextContent( 'after' );
		}
	} );

	test( 'are attached to the element declared in `attachTo`', async () => {
		const ids = [
			'my-plugin::{"id":"attach-namespaced","attachTo":"#parent-1"}',
			'{"id":"attach-json","attachTo":"#parent-2"}',
			'{"id":"__proto__","attachTo":"#parent-3"}',
		];
		store( 'test/attach', {} );
		for ( let i = 1; i <= ids.length; i++ ) {
			const parent = document.createElement( 'div' );
			parent.id = `parent-${ i }`;
			document.body.appendChild( parent );
		}

		await navigateTo( '/attach', {
			html: pageHtml(
				ids
					.map(
						( id, i ) =>
							`<div data-wp-interactive="test/attach" data-wp-router-region='${ id }'>attached-${ i }</div>`
					)
					.join( '' )
			),
		} );

		ids.forEach( ( _, i ) => {
			expect(
				document.getElementById( `parent-${ i + 1 }` )
			).toHaveTextContent( `attached-${ i }` );
		} );
	} );
} );
