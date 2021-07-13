/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
/**
 * External dependencies
 */
import 'construct-style-sheets-polyfill';
// import { useEffect, useRef } from 'react';

/**
 * Adds encapsulated styles to a given element.
 * Adds given inline CSS or array of constructed stylesheets to element's shadow root.
 *
 * @param {string | null} [inlineStyles] Styles to be addes inline.
 * @param {Array<CSSStyleSheet> | null} [styleSheets] Array of (constructed) style sheets to be adopted.
 * @return {any} React ref for a HTMLElement to be styled.
 */
export default function useShadowStyles( inlineStyles, styleSheets = null ) {
	const shadowHost = useRef( null );
	useEffect( () => {
		if ( shadowHost.current ) {
			// @ts-ignore shadowHost.current is not null
			let shadowRoot = shadowHost.current.shadowRoot;
			if ( ! shadowRoot ) {
				// @ts-ignore shadowHost.current is not null
				shadowRoot = shadowHost.current.attachShadow( {
					mode: 'open',
				} );
			}
			shadowRoot.innerHTML = inlineStyles
				? `<style>${ inlineStyles }</style><slot></slot>`
				: `<slot><slot>`;
			if ( styleSheets && styleSheets.length > 0 ) {
				shadowRoot.adoptedStyleSheets = styleSheets;
			}
		}
	}, [ shadowHost, inlineStyles, styleSheets ] );

	return shadowHost;
}
/* global CSSStyleSheet, TemplateStringsArray */
/**
 * Construct stylesheet from given template.
 * This is probalby overly simplified version, but good enough for the demo.
 *
 * @param {TemplateStringsArray} strings
 * @param  {...any} values
 * @return {any} constructed stylesheet.
 */
export function css( strings, ...values ) {
	let str = '';
	strings.forEach( ( string, i ) => {
		str += string + ( values[ i ] || '' );
	} );
	const sheet = new CSSStyleSheet();
	// sheet.replaceSync(`:host{${str}}`);
	sheet.replaceSync( `${ str }` );
	return sheet;
}
