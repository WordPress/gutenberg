import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../lock-unlock';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

type AttributesWithFontFamily = Record< string, unknown > & {
	style?: Record< string, unknown > & {
		typography?: Record< string, unknown > & { fontFamily?: string };
	};
};

/**
 * Migrates the current style.typography.fontFamily attribute,
 * whose value was "var:preset|font-family|helvetica-arial",
 * to the style.fontFamily attribute, whose value will be "helvetica-arial".
 *
 * @param attributes The current attributes
 * @return The updated attributes.
 */
export default function < T extends AttributesWithFontFamily >(
	attributes: T
): T {
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
