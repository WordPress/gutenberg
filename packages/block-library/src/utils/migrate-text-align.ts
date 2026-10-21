type AttributesWithTextAlign = Record< string, unknown > & {
	textAlign?: string;
	style?: Record< string, unknown > & {
		typography?: Record< string, unknown >;
	};
};

/**
 * Migrates the current textAlign attribute,
 *
 * @param attributes The current attributes
 * @return The updated attributes.
 */
export default function < T extends AttributesWithTextAlign >(
	attributes: T
): T {
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
	} as unknown as T;
}
