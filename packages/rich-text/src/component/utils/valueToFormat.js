/**
 * WordPress dependencies
 */
import {toHTMLString} from '@wordpress/rich-text';
/**
 * External dependencies
 */
import {curry} from 'ramda';
import {removeEditorOnlyFormats} from '@wordpress/packages/rich-text/src/component/utils';

/**
 * Converts the internal value to the external data format.
 *
 * @param root0
 * @param root0.formatTypes
 * @param root0.disableFormats
 * @param root0.format
 * @param root0.multilineTag
 * @param root0.preserveWhiteSpace
 * @param val
 * @return {*} The external data format, data type depends on props.
 */
const _valueToFormat = (
	{ formatTypes, disableFormats, format, multilineTag, preserveWhiteSpace },
	val
) => {
	if ( disableFormats ) {
		return val.text;
	}
	if ( format !== 'string' ) {
		return;
	}

	const value = removeEditorOnlyFormats( { val, formatTypes } );
	return toHTMLString( {
		value,
		multilineTag,
		preserveWhiteSpace,
	} );
};
export const valueToFormat = curry( _valueToFormat );
