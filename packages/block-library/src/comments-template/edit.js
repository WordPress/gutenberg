export default function CommentsTemplateEdit( { context: { query } } ) {
	// XXX TODO: actually implement this
	return (
		<div>
			<p>
				Here will be the comments, but for now we just stringify the
				query
			</p>
			<pre>{ JSON.stringify( query ) }</pre>
		</div>
	);
}
