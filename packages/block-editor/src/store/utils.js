export function mapRichTextSettings( attributeDefinition ) {
	const {
		multiline: multilineTag,
		__unstableMultilineWrapperTags: multilineWrapperTags,
		__unstablePreserveWhiteSpace: preserveWhiteSpace,
	} = attributeDefinition;
	return {
		multilineTag,
		multilineWrapperTags,
		preserveWhiteSpace,
	};
}
