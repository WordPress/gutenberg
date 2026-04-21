/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

// @see packages/block-editor/src/components/inserter/search-items.js
export const normalizeInput = ( input: string ) =>
	removeAccents( input ).replace( /^\//, '' ).toLowerCase();

export const normalizedSearch = ( title: string, search: string ) =>
	-1 !== normalizeInput( title ).indexOf( normalizeInput( search ) );
