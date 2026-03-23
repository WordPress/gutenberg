/**
 * WordPress dependencies
 */
import {
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { count as wordCount } from '@wordpress/wordcount';
import type { Strategy } from '@wordpress/wordcount';
import { humanTimeDiff } from '@wordpress/date';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

// Taken from packages/editor/src/components/time-to-read/index.js.
const AVERAGE_READING_RATE = 189;

export default function PostContentInfoView( { item }: { item: BasePost } ) {
	const content =
		typeof item.content === 'string'
			? item.content
			: item.content?.raw || '';

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x(
		'words',
		'Word count type. Do not translate!'
	) as Strategy;
	const wordsCounted = useMemo(
		() => ( content ? wordCount( content, wordCountType ) : 0 ),
		[ content, wordCountType ]
	);

	const modified = item.modified;

	if ( ! wordsCounted && ! modified ) {
		return null;
	}

	let contentInfoText: string | undefined;
	if ( wordsCounted ) {
		const readingTime = Math.round( wordsCounted / AVERAGE_READING_RATE );
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
		contentInfoText = sprintf(
			/* translators: 1: How many words a post has. 2: the number of minutes to read the post (e.g. 130 words, 2 minutes read time.) */
			__( '%1$s, %2$s read time.' ),
			wordsCountText,
			minutesText
		);
	}

	return (
		<VStack spacing={ 1 }>
			{ contentInfoText && (
				<Text variant="muted">{ contentInfoText }</Text>
			) }
			{ modified && (
				<Text variant="muted">
					{ sprintf(
						// translators: %s: Human-readable time difference, e.g. "2 days ago".
						__( 'Last edited %s.' ),
						humanTimeDiff( modified )
					) }
				</Text>
			) }
		</VStack>
	);
}
