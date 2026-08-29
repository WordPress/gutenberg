/**
 * Migrates the current textAlign attribute,
 *
 * @param {Object} attributes The current attributes
 * @return {Object} The updated attributes.
 */
export default function ( attributes ) {
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
