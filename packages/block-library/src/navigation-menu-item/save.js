export default function save( { attributes } ) {
	return (
		<a
			href={ attributes.destination }
			rel={ attributes.rel }
			title={ attributes.title }
			target={ attributes.opensInNewTab && '_blank' }
		>
			{ attributes.label }
		</a>
	);
}
