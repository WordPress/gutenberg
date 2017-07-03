/**
 * External dependencies
 */
import { uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import classnames from 'classnames';

export function normalizeTranscript( value ) {
	const transcript = {
		authors: [],
		messages: [],
	};

	if ( ! value ) {
		return transcript;
	}

	let authorIndex = -1;

	value.split( '\n' ).map( ( line ) => {
		line = line.trim();

		const messageParts = line.split( ':' );
		let message;

		if ( 1 === messageParts.length ) {
			message = messageParts.shift();
		} else {
			const author = messageParts.shift().trim();
			message = messageParts.join( ':' ).trim();

			transcript.authors.push( author );
			transcript.authors = uniq( transcript.authors );
			authorIndex = transcript.authors.indexOf( author );
		}

		transcript.messages.push( {
			message: message,
			authorIndex: authorIndex,
		} );
	} );

	return transcript;
}

export default function ChatTranscript( { value, compact, className } ) {
	// Normalize data
	const transcript = normalizeTranscript( value );

	const classes = classnames( className, { 'is-compact': compact } );

	return (
		<div className={ classes }>
			{value && transcript.messages.map( ( entry, index ) => {
				const author = -1 !== entry.authorIndex ? transcript.authors[ entry.authorIndex ] : undefined;

				return (
					entry.message && <p className={ author && `chat-author-${ entry.authorIndex }` } key={ index }>
						{ author && <span className="chat-author">{ `${ author }:` }</span> }
						<span className="chat-message">{ entry.message }</span>
					</p>
				);
			} ) }
		</div>
	);
}
