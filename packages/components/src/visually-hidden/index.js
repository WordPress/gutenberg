
function VisuallyHidden( {
	children,
	isInline = false,
} ) {
	const TagName = isInline ? 'span' : 'div';
	return (
		<TagName className="components-visually-hidden">
			{ children }
		</TagName>
	);
}

export default VisuallyHidden;
