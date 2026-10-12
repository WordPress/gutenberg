import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hydrate } from 'preact';
import { act } from 'preact/test-utils';
import '../index'; // Registers all core directives.
import { hydratedIslands, toVdom } from '../../vdom';
import { store } from '../../store';

let namespaceCount = 0;

// Each test gets its own store namespace: the store registry is a module
// singleton, so reusing a namespace across tests would leak state.
function uniqueNamespace(): string {
	return `test/directives-${ ++namespaceCount }`;
}

function createRegion( namespace: string, innerHtml: string ): HTMLElement {
	const container = document.createElement( 'div' );
	container.innerHTML = `<div data-wp-interactive='{ "namespace": "${ namespace }" }'>${ innerHtml }</div>`;
	document.body.appendChild( container );
	return container.firstElementChild as HTMLElement;
}

async function hydrateRegion( region: HTMLElement ) {
	await act( () => hydrate( toVdom( region ), region.parentNode! ) );
}

beforeEach( () => {
	document.body.innerHTML = '';
	// @ts-expect-error `_values` is an internal property, accessed here for testing.
	hydratedIslands._values = new WeakMap();
} );

afterEach( () => {
	vi.unstubAllGlobals();
} );

describe( 'event directives', () => {
	it( 'use the complete suffix as the event name and warn about two hyphens', async () => {
		const namespace = uniqueNamespace();
		const click = vi.fn();
		const resize = vi.fn();
		const keydown = vi.fn();
		store( namespace, { actions: { click, resize, keydown } } );

		const region = createRegion(
			namespace,
			'<button data-wp-on--click--counter="actions.click"></button>' +
				'<div data-wp-on-window--resize--second="actions.resize"></div>' +
				'<div data-wp-on-document--keydown--second="actions.keydown"></div>'
		);
		await hydrateRegion( region );
		const button = region.querySelector( 'button' )!;

		await act( () => {
			button.dispatchEvent( new Event( 'click' ) );
			window.dispatchEvent( new Event( 'resize' ) );
			document.dispatchEvent( new Event( 'keydown' ) );
		} );
		expect( click ).not.toHaveBeenCalled();
		expect( resize ).not.toHaveBeenCalled();
		expect( keydown ).not.toHaveBeenCalled();

		await act( () => {
			button.dispatchEvent( new Event( 'click--counter' ) );
			window.dispatchEvent( new Event( 'resize--second' ) );
			document.dispatchEvent( new Event( 'keydown--second' ) );
		} );
		expect( click ).toHaveBeenCalledTimes( 1 );
		expect( resize ).toHaveBeenCalledTimes( 1 );
		expect( keydown ).toHaveBeenCalledTimes( 1 );

		expect( console ).toHaveWarnedWith(
			'The data-wp-on--click--counter directive listens for an event named "click--counter". Two-hyphen unique IDs are no longer supported. If you meant to add a unique ID, please use data-wp-on--click---counter instead.'
		);
		expect( console ).toHaveWarnedWith(
			'The data-wp-on-window--resize--second directive listens for an event named "resize--second". Two-hyphen unique IDs are no longer supported. If you meant to add a unique ID, please use data-wp-on-window--resize---second instead.'
		);
		expect( console ).toHaveWarnedWith(
			'The data-wp-on-document--keydown--second directive listens for an event named "keydown--second". Two-hyphen unique IDs are no longer supported. If you meant to add a unique ID, please use data-wp-on-document--keydown---second instead.'
		);
	} );

	it( 'do not warn about two hyphens when SCRIPT_DEBUG is disabled', async () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', false );
		const namespace = uniqueNamespace();
		store( namespace, { actions: { click: vi.fn() } } );

		const region = createRegion(
			namespace,
			'<button data-wp-on--click--production="actions.click"></button>'
		);
		await hydrateRegion( region );

		expect( console ).not.toHaveWarned();
	} );

	it( 'keep cutting the event name at two hyphens in deprecated async directives', async () => {
		const namespace = uniqueNamespace();
		const click = vi.fn();
		store( namespace, { actions: { click } } );

		const region = createRegion(
			namespace,
			'<button data-wp-on-async--click--legacy="actions.click"></button>'
		);
		await hydrateRegion( region );

		await act( async () => {
			region
				.querySelector( 'button' )!
				.dispatchEvent( new Event( 'click' ) );
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
		} );

		expect( click ).toHaveBeenCalledTimes( 1 );
		expect( console ).toHaveWarnedWith(
			'The usage of data-wp-on-async is deprecated and will stop working in WordPress 7.0. Please, use data-wp-on with the withSyncEvent() helper from now on.'
		);
	} );
} );

describe( 'lifecycle directives', () => {
	it( 'skip suffixes and keep three-hyphen unique IDs', async () => {
		const namespace = uniqueNamespace();
		const unsupported = {
			watch: vi.fn(),
			watchWithUniqueId: vi.fn(),
			init: vi.fn(),
			run: vi.fn(),
		};
		const supported = {
			watchOne: vi.fn(),
			watchTwo: vi.fn(),
			initOne: vi.fn(),
			initTwo: vi.fn(),
			runOne: vi.fn(),
			runTwo: vi.fn(),
		};
		store( namespace, { callbacks: { ...unsupported, ...supported } } );

		const region = createRegion(
			namespace,
			'<span data-wp-watch--dev="callbacks.watch"></span>' +
				'<span data-wp-watch--dev---two="callbacks.watchWithUniqueId"></span>' +
				'<span data-wp-watch---one="callbacks.watchOne"></span>' +
				'<span data-wp-watch---two="callbacks.watchTwo"></span>' +
				'<span data-wp-init--dev="callbacks.init"></span>' +
				'<span data-wp-init---one="callbacks.initOne"></span>' +
				'<span data-wp-init---two="callbacks.initTwo"></span>' +
				'<span data-wp-run--dev="callbacks.run"></span>' +
				'<span data-wp-run---one="callbacks.runOne"></span>' +
				'<span data-wp-run---two="callbacks.runTwo"></span>'
		);
		await hydrateRegion( region );

		Object.values( unsupported ).forEach( ( callback ) =>
			expect( callback ).not.toHaveBeenCalled()
		);
		Object.values( supported ).forEach( ( callback ) =>
			expect( callback ).toHaveBeenCalledTimes( 1 )
		);
		expect( console ).toHaveWarnedWith(
			'Suffixes for the data-wp-watch directive are not supported. Ignoring the directive with suffix "dev".'
		);
		expect( console ).toHaveWarnedWith(
			'Suffixes for the data-wp-init directive are not supported. Ignoring the directive with suffix "dev".'
		);
		expect( console ).toHaveWarnedWith(
			'Suffixes for the data-wp-run directive are not supported. Ignoring the directive with suffix "dev".'
		);
	} );

	it( 'skip suffixes without warning when SCRIPT_DEBUG is disabled', async () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', false );
		const namespace = uniqueNamespace();
		const callbacks = {
			watch: vi.fn(),
			init: vi.fn(),
			run: vi.fn(),
		};
		store( namespace, { callbacks } );

		const region = createRegion(
			namespace,
			'<span data-wp-watch--production="callbacks.watch"></span>' +
				'<span data-wp-init--production="callbacks.init"></span>' +
				'<span data-wp-run--production="callbacks.run"></span>'
		);
		await hydrateRegion( region );

		Object.values( callbacks ).forEach( ( callback ) =>
			expect( callback ).not.toHaveBeenCalled()
		);
		expect( console ).not.toHaveWarned();
	} );
} );

describe( 'data-wp-ignore', () => {
	it( 'no longer prevents hydration and warns', async () => {
		const namespace = uniqueNamespace();
		store( namespace, { state: { text: 'hydrated' } } );

		const region = createRegion(
			namespace,
			'<div data-wp-ignore><span data-wp-text="state.text">server</span></div>'
		);
		await hydrateRegion( region );

		expect( region.querySelector( 'span' ) ).toHaveTextContent(
			'hydrated'
		);
		expect( console ).toHaveWarnedWith(
			'The data-wp-ignore directive has been removed. The element and its descendants are now hydrated like any other element. Please remove the attribute.'
		);
	} );
} );

describe( 'negation operator', () => {
	it( 'does not invoke functions and warns about derived state', async () => {
		const namespace = uniqueNamespace();
		const isClosed = vi.fn( () => true );
		store( namespace, { actions: { isClosed } } );

		const region = createRegion(
			namespace,
			'<span data-wp-bind--hidden="!actions.isClosed"></span>'
		);
		await hydrateRegion( region );

		expect( isClosed ).not.toHaveBeenCalled();
		expect( region.querySelector( 'span' ) ).not.toHaveAttribute(
			'hidden'
		);
		expect( console ).toHaveWarnedWith(
			'The value of "actions.isClosed" is a function and cannot be negated. Please use derived state instead.'
		);
	} );

	it( 'does not invoke functions or warn when SCRIPT_DEBUG is disabled', async () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', false );
		const namespace = uniqueNamespace();
		const isOpen = vi.fn( () => false );
		store( namespace, { actions: { isOpen } } );

		const region = createRegion(
			namespace,
			'<span data-wp-bind--hidden="!actions.isOpen"></span>'
		);
		await hydrateRegion( region );

		expect( isOpen ).not.toHaveBeenCalled();
		expect( region.querySelector( 'span' ) ).not.toHaveAttribute(
			'hidden'
		);
		expect( console ).not.toHaveWarned();
	} );

	it( 'still negates plain values and getters', async () => {
		const namespace = uniqueNamespace();
		const { state } = store( namespace, {
			state: {
				isOpen: false,
				get isVisible() {
					return state.isOpen;
				},
			},
		} );

		const region = createRegion(
			namespace,
			'<span data-testid="value" data-wp-bind--hidden="!state.isOpen"></span>' +
				'<span data-testid="getter" data-wp-bind--hidden="!state.isVisible"></span>'
		);
		await hydrateRegion( region );
		const valueElement = region.querySelector( '[data-testid="value"]' )!;
		const getterElement = region.querySelector( '[data-testid="getter"]' )!;

		expect( valueElement ).toHaveAttribute( 'hidden' );
		expect( getterElement ).toHaveAttribute( 'hidden' );

		await act( () => {
			state.isOpen = true;
		} );

		expect( valueElement ).not.toHaveAttribute( 'hidden' );
		expect( getterElement ).not.toHaveAttribute( 'hidden' );
		expect( console ).not.toHaveWarned();
	} );
} );
