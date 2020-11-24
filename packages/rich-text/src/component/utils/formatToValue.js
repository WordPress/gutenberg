/**
 * External dependencies
 */
import {pipe} from 'ramda';
/**
 * WordPress dependencies
 */
import {create} from '@wordpress/rich-text';
import {
	applyMultilineTagWhenNeeded,
	createPrepareEditableTree,
} from '@wordpress/packages/rich-text/src/component/utils';

const valueForDisabledFormat = ( text ) => ( {
	text,
	formats: Array( text.length ),
	replacements: Array( text.length ),
} );

/**
 * Converts the outside data structure to our internal representation.
 *
 * @param root0
 * @param root0.disableFormats
 * @param root0.valueHandlers
 * @param root0.multilineTag
 * @param root0.preserveWhiteSpace
 * @param root0.string
 * @param root0.format
 * @return {Object} An internal rich-text value.
 */
export const formatToValue = ( {
	disableFormats,
	valueHandlers,
	multilineTag,
	preserveWhiteSpace,
	string,
	format,
} ) => {
	if ( disableFormats ) {
		return valueForDisabledFormat( string );
	}

	if ( format !== 'string' ) {
		return string;
	}

	const editableTree = pipe(
		applyMultilineTagWhenNeeded,
		create
	)( {
		string,
		multilineTag,
		valueHandlers,
		preserveWhiteSpace,
	} );
	return {
		...editableTree,
		formats: createPrepareEditableTree( valueHandlers )( editableTree ),
	};
};
