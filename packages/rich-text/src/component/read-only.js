export default function readOnly( {
	tagName: Tag = 'div',
	record,
	valueToEditableHTML,
	isPlaceholderVisible,
	...props
} ) {
	return (
		<Tag
			data-is-placeholder-visible={ isPlaceholderVisible }
			dangerouslySetInnerHTML={ { __html: valueToEditableHTML( record ) } }
			{ ...props }
		/>
	);
}
