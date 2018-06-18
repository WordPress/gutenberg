/**
 * WordPress dependencies
 */
import * as blob from '@wordpress/blob';
import * as dom from '@wordpress/dom';
import originalDeprecated from '@wordpress/deprecated';

const wrapFunction = ( source, sourceName, version ) =>
	( functionName ) => ( ...args ) => {
		originalDeprecated( `wp.utils.${ functionName }`, {
			version,
			alternative: `wp.${ sourceName }.${ functionName }`,
			plugin: 'Gutenberg',
		} );
		return source[ functionName ]( ...args );
	};

// blob
const wrapBlobFunction = wrapFunction( blob, 'blob', '3.2' );
export const createBlobURL = wrapBlobFunction( 'createBlobURL' );
export const getBlobByURL = wrapBlobFunction( 'getBlobByURL' );
export const revokeBlobURL = wrapBlobFunction( 'revokeBlobURL' );

// dom
const wrapDomFunction = wrapFunction( dom, 'dom', '3.1' );
export const computeCaretRect = wrapDomFunction( 'computeCaretRect' );
export const documentHasSelection = wrapDomFunction( 'documentHasSelection' );
export const focus = {
	focusable: {
		find: wrapFunction( dom.focus.focusable, 'dom.focus.focusable', '3.1' )( 'find' ),
	},
	tabbable: {
		find: wrapFunction( dom.focus.tabbable, 'dom.focus.tabbable', '3.1' )( 'find' ),
		isTabbableIndex: wrapFunction( dom.focus.tabbable, 'dom.focus.tabbable', '3.1' )( 'isTabbableIndex' ),
	},
};
export const getRectangleFromRange = wrapDomFunction( 'getRectangleFromRange' );
export const getScrollContainer = wrapDomFunction( 'getScrollContainer' );
export const insertAfter = wrapDomFunction( 'insertAfter' );
export const isHorizontalEdge = wrapDomFunction( 'isHorizontalEdge' );
export const isTextField = wrapDomFunction( 'isTextField' );
export const isVerticalEdge = wrapDomFunction( 'isVerticalEdge' );
export const placeCaretAtHorizontalEdge = wrapDomFunction( 'placeCaretAtHorizontalEdge' );
export const placeCaretAtVerticalEdge = wrapDomFunction( 'placeCaretAtVerticalEdge' );
export const remove = wrapDomFunction( 'remove' );
export const replace = wrapDomFunction( 'replace' );
export const replaceTag = wrapDomFunction( 'replaceTag' );
export const unwrap = wrapDomFunction( 'unwrap' );

// deprecated
export function deprecated( ...params ) {
	originalDeprecated( 'wp.utils.deprecated', {
		version: '3.2',
		alternative: 'wp.deprecated',
		plugin: 'Gutenberg',
	} );

	return originalDeprecated( ...params );
}

// viewport
export function isExtraSmall() {
	originalDeprecated( 'wp.utils.isExtraSmall', {
		version: '3.1',
		alternative: 'wp.viewport.isExtraSmall',
		plugin: 'Gutenberg',
	} );

	return window && window.innerWidth < 782;
}
