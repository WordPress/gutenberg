/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

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

	const { fontFamily, ...typography } = attributes.style.typography;

	return {
		...attributes,
		style: cleanEmptyObject( {
			...attributes.style,
			typography,
		} ),
		fontFamily: fontFamily.split( '|' ).pop(),
	};
}
