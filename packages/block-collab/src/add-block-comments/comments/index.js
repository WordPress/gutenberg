/**
 * Internal dependencies
 */
import Comment from '../comment';

export default function Comments( {
	comments = [],
	setComments,
	cancelDraft,
} ) {
	return (
		<>
			{ comments.map( ( comment, index ) => (
				<Comment
					key={ index }
					content={ comment.content }
					setContent={ ( content ) =>
						setComments(
							comments.map( ( _comment, _index ) =>
								_index === index ? { content } : _comment
							)
						)
					}
				/>
			) ) }
			{ cancelDraft && (
				<Comment
					setContent={ ( content ) =>
						setComments( [ ...comments, { content } ] )
					}
					cancelDraft={ cancelDraft }
				/>
			) }
		</>
	);
}
