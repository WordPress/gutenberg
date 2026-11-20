import type { StyledBlockAttributes } from './types';

/**
 * Migrates the current textAlign attribute,
 *
 * @param attributes The current attributes
 * @return The updated attributes.
 */
export default function (
	attributes: StyledBlockAttributes
): StyledBlockAttributes {
	const { textAlign, ...restAttributes } = attributes;
	if ( ! textAlign ) {
		return attributes;
	}
	return {
		...restAttributes,
		style: {
			...attributes.style,
			typography: {
				...attributes.style?.typography,
				textAlign,
			},
		},
	};
}
