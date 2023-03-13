export default function Launch( { theme, category, variation } ) {
	return (
		<div>
			<p>Theme: { theme }</p>
			<p>Category: { category }</p>
			<p>Variation: { variation?.title }</p>
		</div>
	);
}
