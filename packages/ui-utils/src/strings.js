/**
 * External dependencies
 */
import _ from 'lodash';

export const kebabCase = _.kebabCase;
export const capitalize = _.capitalize;
export const upperFirst = _.upperFirst;
export const repeat = _.repeat;

/**
 * @param {string} str
 * @return {string}
 */
export function camel2hyphen( str ) {
	return str
		.replace( /[A-Z]/g, function ( match ) {
			return '-' + match.toLowerCase();
		} )
		.toLowerCase();
}
