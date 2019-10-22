
function VisuallyHidden( {
	children,
	isInline = false,
} ) {
	const TagName = isInline ? 'span' : 'div';
	return (
		<TagName className="screen-reader-text">
			{ children }
		</TagName>
	);
}

export default VisuallyHidden;
