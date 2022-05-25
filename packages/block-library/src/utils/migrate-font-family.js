/**
 * External dependencies
 */
import { cloneDeep } from 'lodash';

/**
 * Internal dependencies
 */
import cleanEmptyObject from './clean-empty-object';

/**
 * Migrates the current style.typography.fontFamily attribute,
 * whose value was "var:preset|font-family|helvetica-arial",
 * to the style.fontFamily attribute, whose value will be "helvetica-arial".
 *
 * @param {Object} attributes The current attributes
 * @return {Object} The updated attributes.
 */
export default function ( attributes ) {
	if ( ! attributes?.style?.typography?.fontFamily ) {
		return attributes;
	}

	// Clone first so when we delete the fontFamily
	// below we're not modifying the original
	// attributes. Because the deprecation may be discarded
	// we don't want to alter the original attributes.
	const atts = cloneDeep( attributes );
	const fontFamily = atts.style.typography.fontFamily.split( '|' ).pop();
	delete atts.style.typography.fontFamily;
	atts.style = cleanEmptyObject( atts.style );

	return {
		...atts,
		fontFamily,
	};
}
