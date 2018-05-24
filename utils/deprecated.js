/**
 * WordPress dependencies
 */
import * as dom from '@wordpress/dom';
import originalDeprecated from '@wordpress/deprecated';

const wrapFunction = ( functionName, source = dom ) => ( ...args ) => {
	originalDeprecated( 'wp.utils.' + functionName, {
		version: '3.1',
		alternative: 'wp.dom.' + functionName,
		plugin: 'Gutenberg',
	} );
	return source[ functionName ]( ...args );
};

export const computeCaretRect = wrapFunction( 'computeCaretRect' );
export const documentHasSelection = wrapFunction( 'documentHasSelection' );
export const focus = {
	focusable: {
		find: wrapFunction( 'find', dom.focus.focusable ),
	},
	tabbable: {
		find: wrapFunction( 'find', dom.focus.tabbable ),
		isTabbableIndex: wrapFunction( 'isTabbableIndex', dom.focus.tabbable ),
	},
};
export const getRectangleFromRange = wrapFunction( 'getRectangleFromRange' );
export const getScrollContainer = wrapFunction( 'getScrollContainer' );
export const insertAfter = wrapFunction( 'insertAfter' );
export const isHorizontalEdge = wrapFunction( 'isHorizontalEdge' );
export const isTextField = wrapFunction( 'isTextField' );
export const isVerticalEdge = wrapFunction( 'isVerticalEdge' );
export const placeCaretAtHorizontalEdge = wrapFunction( 'placeCaretAtHorizontalEdge' );
export const placeCaretAtVerticalEdge = wrapFunction( 'placeCaretAtVerticalEdge' );
export const remove = wrapFunction( 'remove' );
export const replace = wrapFunction( 'replace' );
export const replaceTag = wrapFunction( 'replaceTag' );
export const unwrap = wrapFunction( 'unwrap' );

export function deprecated( ...params ) {
	originalDeprecated( 'wp.utils.deprecated', {
		version: '3.2',
		alternative: 'wp.deprecated',
		plugin: 'Gutenberg',
	} );

	return originalDeprecated( ...params );
}

export function isExtraSmall() {
	originalDeprecated( 'wp.utils.isExtraSmall', {
		version: '3.1',
		alternative: 'wp.viewport.isExtraSmall',
		plugin: 'Gutenberg',
	} );

	return window && window.innerWidth < 782;
}
