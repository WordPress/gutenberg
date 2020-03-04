/**
 * Internal dependencies
 */

import { supportedFilters } from '../constants';

const filterCssName = ( filter ) => `richimage-filter__${ filter }`;
const addClass = ( existing, toAdd ) =>
	existing !== undefined ? existing + ' ' + toAdd : toAdd;
const removeClass = ( existing, toRemove ) =>
	existing
		.replace( toRemove, '' )
		.replace( /  /, '' )
		.trim();

export const getImageClass = ( attrs, existingClass ) => {
	let className =
		existingClass === 'undefined' || existingClass === undefined
			? ''
			: existingClass;

	if ( attrs.imageFilter !== undefined ) {
		// Remove all filters
		supportedFilters.forEach( ( filter ) => {
			className = removeClass( className, filterCssName( filter.value ) );
		} );

		if ( attrs.imageFilter !== '' ) {
			className = addClass(
				className,
				filterCssName( attrs.imageFilter )
			);
		}
	}

	return {
		className,
	};
};
