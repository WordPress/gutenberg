/**
 * External dependencies
 */
import { deburr } from 'lodash';

// @see packages/block-editor/src/components/inserter/search-items.js
export const normalizeInput = ( input ) =>
	deburr( input ).replace( /^\//, '' ).toLowerCase();

export const normalizedSearch = ( title, search ) =>
	-1 !== normalizeInput( title ).indexOf( normalizeInput( search ) );
