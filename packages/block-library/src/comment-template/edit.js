export default function CommentTemplateEdit( { context: { queryPerPage } } ) {
	return (
		<div>
			<p>
				Here will be the comments, but for now we just stringify the
				context
			</p>
			<pre>{ JSON.stringify( { queryPerPage } ) }</pre>
		</div>
	);
}
