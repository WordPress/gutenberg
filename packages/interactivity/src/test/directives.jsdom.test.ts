import { hydrate } from 'preact';
import { act } from 'preact/test-utils';
import { expect, test, vi } from 'vitest';

await vi.hoisted( async () => {
	window.performance.getEntriesByType = () =>
		[
			{ domContentLoadedEventStart: 1 },
		] as unknown as PerformanceEntryList;
	window.performance.measure = () =>
		undefined as unknown as PerformanceMeasure;
} );

/**
 * Appends directive markup to the document and hydrates it as the runtime does.
 *
 * @param html                  Markup containing a single root element.
 * @param toVdom                Converts the root element into a virtual DOM tree.
 * @param getRegionRootFragment Gets the hydration fragment for the root element.
 * @return The hydrated root element.
 */
function hydrateHtml(
	html: string,
	toVdom: typeof import( '../vdom' ).toVdom,
	getRegionRootFragment: typeof import( '../hydration' ).getRegionRootFragment
): Element {
	const container = document.createElement( 'div' );
	container.innerHTML = html;
	document.body.appendChild( container );
	const element = container.firstElementChild as Element;
	hydrate( toVdom( element ), getRegionRootFragment( element ) );
	return element;
}

test( 'event directives listen for the complete suffix', async () => {
	const { privateApis, store } = await import( '../index' );
	const { toVdom, getRegionRootFragment, afterNextFrame } = privateApis(
		'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
	);

	/** Records invocations of the click event action. */
	const clickAction = vi.fn();
	/** Records invocations of the window resize action. */
	const resizeAction = vi.fn();
	/** Records invocations of the document keydown action. */
	const keydownAction = vi.fn();

	store( 'test/event-directives', {
		actions: {
			/** Handles the `click--counter` event. */
			click: clickAction,
			/** Handles the `resize--second` event. */
			resize: resizeAction,
			/** Handles the `keydown--second` event. */
			keydown: keydownAction,
		},
	} );

	/** Hydrated buttons and their containing interactive region. */
	const root = hydrateHtml(
		'<div data-wp-interactive="test/event-directives"><button data-wp-on--click--counter="actions.click"></button><button data-wp-on-window--resize--second="actions.resize"></button><button data-wp-on-document--keydown--second="actions.keydown"></button></div>',
		toVdom,
		getRegionRootFragment
	);
	const clickButton = root.querySelector( 'button' )!;

	try {
		await afterNextFrame( () => undefined );

		await act( () => {
			clickButton.dispatchEvent( new Event( 'click' ) );
			window.dispatchEvent( new Event( 'resize' ) );
			document.dispatchEvent( new Event( 'keydown' ) );
		} );

		expect( clickAction ).not.toHaveBeenCalled();
		expect( resizeAction ).not.toHaveBeenCalled();
		expect( keydownAction ).not.toHaveBeenCalled();

		await act( () => {
			clickButton.dispatchEvent( new Event( 'click--counter' ) );
			window.dispatchEvent( new Event( 'resize--second' ) );
			document.dispatchEvent( new Event( 'keydown--second' ) );
		} );

		expect( clickAction ).toHaveBeenCalledTimes( 1 );
		expect( resizeAction ).toHaveBeenCalledTimes( 1 );
		expect( keydownAction ).toHaveBeenCalledTimes( 1 );
		expect( console ).not.toHaveWarned();
	} finally {
		root.parentElement?.remove();
	}
} );

test( 'lifecycle directives skip suffixes and keep three-hyphen IDs', async () => {
	const { privateApis, store } = await import( '../index' );
	const { toVdom, getRegionRootFragment, afterNextFrame } = privateApis(
		'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
	);

	/** Records invocations of suffixed lifecycle callbacks. */
	const unsupportedCallbacks = {
		watch: vi.fn(),
		watchWithUniqueId: vi.fn(),
		init: vi.fn(),
		run: vi.fn(),
	};
	/** Records invocations of lifecycle callbacks with supported unique IDs. */
	const uniqueIdCallbacks = {
		watchOne: vi.fn(),
		watchTwo: vi.fn(),
		initOne: vi.fn(),
		initTwo: vi.fn(),
		runOne: vi.fn(),
		runTwo: vi.fn(),
	};
	store( 'test/lifecycle-directives', {
		callbacks: {
			watch: unsupportedCallbacks.watch,
			watchWithUniqueId: unsupportedCallbacks.watchWithUniqueId,
			init: unsupportedCallbacks.init,
			run: unsupportedCallbacks.run,
			...uniqueIdCallbacks,
		},
	} );

	vi.stubGlobal( 'SCRIPT_DEBUG', false );
	const productionRoot = hydrateHtml(
		'<div data-wp-interactive="test/lifecycle-directives"><span data-wp-watch--one="callbacks.watch"></span><span data-wp-watch--one---two="callbacks.watchWithUniqueId"></span><span data-wp-init--one="callbacks.init"></span><span data-wp-run--one="callbacks.run"></span></div>',
		toVdom,
		getRegionRootFragment
	);
	try {
		await afterNextFrame( () => undefined );
		expect( unsupportedCallbacks.watch ).not.toHaveBeenCalled();
		expect( unsupportedCallbacks.watchWithUniqueId ).not.toHaveBeenCalled();
		expect( unsupportedCallbacks.init ).not.toHaveBeenCalled();
		expect( unsupportedCallbacks.run ).not.toHaveBeenCalled();
		expect( console ).not.toHaveWarned();
	} finally {
		productionRoot.parentElement?.remove();
	}

	vi.stubGlobal( 'SCRIPT_DEBUG', true );
	const developmentRoot = hydrateHtml(
		'<div data-wp-interactive="test/lifecycle-directives"><span data-wp-watch--one="callbacks.watch"></span><span data-wp-watch--one---two="callbacks.watchWithUniqueId"></span><span data-wp-watch---one="callbacks.watchOne"></span><span data-wp-watch---two="callbacks.watchTwo"></span><span data-wp-init--one="callbacks.init"></span><span data-wp-init---one="callbacks.initOne"></span><span data-wp-init---two="callbacks.initTwo"></span><span data-wp-run--one="callbacks.run"></span><span data-wp-run---one="callbacks.runOne"></span><span data-wp-run---two="callbacks.runTwo"></span></div>',
		toVdom,
		getRegionRootFragment
	);
	try {
		await afterNextFrame( () => undefined );

		expect( unsupportedCallbacks.watch ).not.toHaveBeenCalled();
		expect( unsupportedCallbacks.watchWithUniqueId ).not.toHaveBeenCalled();
		expect( unsupportedCallbacks.init ).not.toHaveBeenCalled();
		expect( unsupportedCallbacks.run ).not.toHaveBeenCalled();
		Object.values( uniqueIdCallbacks ).forEach( ( callback ) =>
			expect( callback ).toHaveBeenCalledTimes( 1 )
		);
		expect( console ).toHaveWarnedWith(
			'Suffixes are not supported for the data-wp-watch directive. Ignoring the directive with suffix "one".'
		);
		expect( console ).toHaveWarnedWith(
			'Suffixes are not supported for the data-wp-init directive. Ignoring the directive with suffix "one".'
		);
		expect( console ).toHaveWarnedWith(
			'Suffixes are not supported for the data-wp-run directive. Ignoring the directive with suffix "one".'
		);
	} finally {
		developmentRoot.parentElement?.remove();
	}
} );
