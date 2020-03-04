/**
 * Internal dependencies
 */

import { supportedFilters } from '../constants';

export const filterCssName = ( filter ) => `richimage-filter__${ filter }`;
const addClass = ( existing, toAdd ) =>
	existing !== undefined ? existing + ' ' + toAdd : toAdd;
const removeClass = ( existing, toRemove ) =>
	existing
		.replace( toRemove, '' )
		.replace( /  /, '' )
		.trim();

export const getFilterClass = ( imageFilter, existingClass ) => {
	let className =
		existingClass === 'undefined' || existingClass === undefined
			? ''
			: existingClass;

	// Remove all filters
	supportedFilters.forEach( ( filter ) => {
		className = removeClass( className, filterCssName( filter.value ) );
	} );

	if ( imageFilter !== '' ) {
		className = addClass( className, filterCssName( imageFilter ) );
	}

	return {
		className,
	};
};
