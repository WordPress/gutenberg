export function shouldShowTemplateOption( {
	isTemplate,
	templateId,
	isFocusedTemplatePart,
} ) {
	return ! isTemplate && !! templateId && ! isFocusedTemplatePart;
}
