export default function EditableQuote( { value, citation } ) {
	const cite = wp.element.createElement( 'cite', null, citation );

	return wp.element.createElement( 'blockquote', { citation }, [ value, cite ] );
}
