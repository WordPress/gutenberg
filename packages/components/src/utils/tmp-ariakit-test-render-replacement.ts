// See https://github.com/WordPress/gutenberg/pull/62947
// and https://github.com/WordPress/gutenberg/pull/64066

/**
 * External dependencies
 */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { createElement, StrictMode, type ReactNode } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as ReactTestingLibrary from '@testing-library/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { isFocusable } from '@ariakit/core/utils/focus';
// eslint-disable-next-line import/no-extraneous-dependencies
import { noop } from '@ariakit/core/utils/misc';

export type DirtiableElement = Element & { dirty?: boolean };

export type TextField = HTMLInputElement | HTMLTextAreaElement;

export const isBrowser =
	typeof navigator !== 'undefined' &&
	// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
	! navigator.userAgent.includes( 'jsdom' ) &&
	typeof window !== 'undefined' &&
	// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
	! ( 'happyDOM' in window );

export async function flushMicrotasks() {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

export function nextFrame() {
	return new Promise( requestAnimationFrame );
}

export function setActEnvironment( value: boolean ) {
	const scope = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
	const previousValue = scope.IS_REACT_ACT_ENVIRONMENT;
	scope.IS_REACT_ACT_ENVIRONMENT = value;
	const restoreActEnvironment = () => {
		scope.IS_REACT_ACT_ENVIRONMENT = previousValue;
	};
	return restoreActEnvironment;
}

export function applyBrowserPolyfills() {
	if ( isBrowser ) {
		return noop;
	}

	const originalFocus = HTMLElement.prototype.focus;

	HTMLElement.prototype.focus = function focus( options ) {
		if ( ! isFocusable( this ) ) {
			return;
		}
		return originalFocus.call( this, options );
	};

	const originalGetClientRects = Element.prototype.getClientRects;

	// @ts-expect-error
	Element.prototype.getClientRects = function getClientRects() {
		const isHidden = ( element: Element ) => {
			if ( ! element.isConnected ) {
				return true;
			}
			if ( element.parentElement && isHidden( element.parentElement ) ) {
				return true;
			}
			if ( ! ( element instanceof HTMLElement ) ) {
				return false;
			}
			if ( element.hidden ) {
				return true;
			}
			const style = getComputedStyle( element );
			return style.display === 'none' || style.visibility === 'hidden';
		};
		if ( isHidden( this ) ) {
			return [];
		}
		return [ { width: 1, height: 1 } ];
	};

	if ( ! Element.prototype.scrollIntoView ) {
		Element.prototype.scrollIntoView = noop;
	}

	if ( ! Element.prototype.hasPointerCapture ) {
		Element.prototype.hasPointerCapture = noop;
	}

	if ( ! Element.prototype.setPointerCapture ) {
		Element.prototype.setPointerCapture = noop;
	}

	if ( ! Element.prototype.releasePointerCapture ) {
		Element.prototype.releasePointerCapture = noop;
	}

	if ( typeof window.ClipboardEvent === 'undefined' ) {
		// @ts-expect-error
		window.ClipboardEvent = class ClipboardEvent extends Event {};
	}

	if ( typeof window.PointerEvent === 'undefined' ) {
		// @ts-expect-error
		window.PointerEvent = class PointerEvent extends MouseEvent {};
	}

	return () => {
		HTMLElement.prototype.focus = originalFocus;
		Element.prototype.getClientRects = originalGetClientRects;
	};
}

export async function wrapAsync< T >( fn: () => Promise< T > ) {
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const restoreActEnvironment = setActEnvironment( false );
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const removeBrowserPolyfills = applyBrowserPolyfills();
	try {
		return await fn();
	} finally {
		restoreActEnvironment();
		removeBrowserPolyfills();
	}
}

export interface RenderOptions
	extends Omit< ReactTestingLibrary.RenderOptions, 'queries' > {
	strictMode?: boolean;
}

export async function render( ui: ReactNode, options?: RenderOptions ) {
	const wrapper = ( props: { children: ReactNode } ) => {
		const Wrapper = options?.wrapper;
		const element = Wrapper
			? createElement( Wrapper, props )
			: props.children;
		if ( ! options?.strictMode ) {
			return element;
		}
		return createElement( StrictMode, undefined, element );
	};

	function wrapRender< T extends ( ...args: any[] ) => any >(
		renderFn: T
	): Promise< ReturnType< T > > {
		return wrapAsync( async () => {
			const output: ReturnType< T > = renderFn();
			await flushMicrotasks();
			await nextFrame();
			await flushMicrotasks();
			return output;
		} );
	}

	return wrapRender( () => {
		const output = ReactTestingLibrary.render( ui, {
			...options,
			wrapper,
		} );
		return {
			...output,
			rerender: ( newUi: ReactNode ) =>
				wrapRender( () => output.rerender( newUi ) ),
		};
	} );
}
