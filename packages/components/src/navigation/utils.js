/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

// @see packages/block-editor/src/components/inserter/search-items.js
export const normalizeInput = ( input ) =>
	removeAccents( input ).replace( /^\//, '' ).toLowerCase();

export const normalizedSearch = ( title, search ) =>
	-1 !== normalizeInput( title ).indexOf( normalizeInput( search ) );
