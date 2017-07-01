/**
 * External dependencies
 */
import { uniq } from 'lodash';

export default function ChatTranscript( props ) {
	const { value, compact } = props;

	let lastAuthor;
	let authors = [];

	function getAuthor( author ) {
		author = author.trim();
		authors.push( author );

		authors = uniq( authors );

		return authors.indexOf( author ) + 1;
	}

	return (
		<div className={ `wp-block-chat${ compact ? ' is-compact' : '' }` }>
			{value && value.split( '\n' ).map( ( line, index ) => {
				line = line.trim();

				let message = line;
				let author;

				if ( line.includes( ':' ) ) {
					// Includes an author.
					const msg = line.split( ':' );
					author = msg.shift().trim();
					message = msg.join( ':' ).trim();

					lastAuthor = getAuthor( author );
				}

				return (
					message && <p className={ `chat-author-${ lastAuthor }` } key={ index }>
						{ author && <span className="chat-author">{ ` ${ author }: ` }</span> }
						<span className="chat-message">{ message }</span>
					</p>
				);
			} ) }
		</div>
	);
}
