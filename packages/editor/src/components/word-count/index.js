/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
import { count as wordCount } from '@wordpress/wordcount';

function WordCount( { content } ) {
	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );

	return (
		<span className="word-count">
			{ wordCount( content, wordCountType ) }
		</span>
	);
}

export default withSelect( ( select ) => {
	return {
		content: select( 'core/editor' ).getEditedPostAttribute( 'content' ),
	};
} )( WordCount );
