/**
 * WordPress dependencies
 */
import * as dom from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { deprecated } from './deprecation';

const wrapFunction = ( functionName, source = dom ) => ( ...args ) => {
	deprecated( 'wp.utils.' + functionName, {
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
