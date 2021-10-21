export default function CommentTemplateEdit( {
	context: { queryPerPage, queryOffset },
} ) {
	// XXX TODO: actually implement this
	return (
		<div>
			<p>
				Here will be the comments, but for now we just stringify the
				context
			</p>
			<pre>{ JSON.stringify( { queryPerPage, queryOffset } ) }</pre>
		</div>
	);
}
