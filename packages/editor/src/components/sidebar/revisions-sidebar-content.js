/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalText as Text,
	ExternalLink,
} from '@wordpress/components';
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import { count as wordCount } from '@wordpress/wordcount';
import { useMemo } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import PostCardPanel from '../post-card-panel';

// Average reading rate in words per minute.
const AVERAGE_READING_RATE = 189;

export default function RevisionsSidebarContent( {
	revisionId,
	revisionDate,
	revisionContent,
} ) {
	// Calculate word count and reading time for this revision.
	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );
	const wordsCounted = useMemo(
		() =>
			revisionContent ? wordCount( revisionContent, wordCountType ) : 0,
		[ revisionContent, wordCountType ]
	);

	const readingTime = Math.round( wordsCounted / AVERAGE_READING_RATE );
	const contentInfoText = useMemo( () => {
		if ( ! wordsCounted ) {
			return '';
		}
		const wordsCountText = sprintf(
			// translators: %s: the number of words in the post.
			_n( '%s word', '%s words', wordsCounted ),
			wordsCounted.toLocaleString()
		);
		const minutesText =
			readingTime <= 1
				? __( '1 minute' )
				: sprintf(
						/* translators: %s: the number of minutes to read the post. */
						_n( '%s minute', '%s minutes', readingTime ),
						readingTime.toLocaleString()
				  );
		return sprintf(
			/* translators: 1: How many words a post has. 2: the number of minutes to read the post (e.g. 130 words, 2 minutes read time.) */
			__( '%1$s, %2$s read time.' ),
			wordsCountText,
			minutesText
		);
	}, [ wordsCounted, readingTime ] );

	const lastEditedText = useMemo( () => {
		if ( ! revisionDate ) {
			return '';
		}
		return sprintf(
			// translators: %s: Human-readable time difference, e.g. "2 days ago".
			__( 'Created %s.' ),
			humanTimeDiff( revisionDate )
		);
	}, [ revisionDate ] );

	const classicRevisionsUrl = addQueryArgs( 'revision.php', {
		revision: revisionId,
	} );

	return (
		<VStack className="editor-revisions-sidebar-content" spacing={ 4 }>
			<PostCardPanel postType="revision" postId={ revisionId } />
			<VStack spacing={ 1 }>
				{ contentInfoText && (
					<div className="editor-post-content-information">
						<Text>{ contentInfoText }</Text>
					</div>
				) }
				{ lastEditedText && (
					<div className="editor-post-last-edited-panel">
						<Text>{ lastEditedText }</Text>
					</div>
				) }
			</VStack>
			<ExternalLink
				className="editor-revisions-sidebar-content__classic-link"
				href={ classicRevisionsUrl }
			>
				{ __( 'Open classic revisions screen' ) }
			</ExternalLink>
		</VStack>
	);
}
