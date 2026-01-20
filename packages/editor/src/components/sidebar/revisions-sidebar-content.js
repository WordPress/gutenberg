/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
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

/**
 * Component to display diff statistics with GitHub-style squares.
 *
 * @param {Object} props       Component props.
 * @param {Object} props.stats The diff statistics object.
 * @return {JSX.Element} The diff stats component.
 */
function DiffStats( { stats } ) {
	// Calculate the ratio squares (like GitHub's diffstat).
	// Number of squares scales with total changes, ratio determines colors.
	const getSquareCount = ( total ) => {
		if ( total === 0 ) {
			return 0;
		}
		if ( total <= 4 ) {
			return 1;
		}
		if ( total <= 9 ) {
			return 2;
		}
		if ( total <= 24 ) {
			return 3;
		}
		if ( total <= 49 ) {
			return 4;
		}
		return 5;
	};

	const totalWords = stats.wordsAdded + stats.wordsRemoved;
	const wordSquareCount = getSquareCount( totalWords );
	const wordSquares = [];
	if ( wordSquareCount > 0 ) {
		const addedCount = Math.round(
			( stats.wordsAdded / totalWords ) * wordSquareCount
		);
		for ( let i = 0; i < wordSquareCount; i++ ) {
			wordSquares.push( i < addedCount ? 'added' : 'removed' );
		}
	}
	// Fill remaining squares as empty
	for ( let i = wordSquares.length; i < 5; i++ ) {
		wordSquares.push( 'empty' );
	}

	const totalBlocks =
		stats.blocksAdded + stats.blocksRemoved + stats.blocksModified;
	const blockSquareCount = getSquareCount( totalBlocks );
	const blockSquares = [];
	if ( blockSquareCount > 0 ) {
		const addedCount = Math.round(
			( stats.blocksAdded / totalBlocks ) * blockSquareCount
		);
		const modifiedCount = Math.round(
			( stats.blocksModified / totalBlocks ) * blockSquareCount
		);
		for ( let i = 0; i < blockSquareCount; i++ ) {
			if ( i < addedCount ) {
				blockSquares.push( 'added' );
			} else if ( i < addedCount + modifiedCount ) {
				blockSquares.push( 'modified' );
			} else {
				blockSquares.push( 'removed' );
			}
		}
	}
	// Fill remaining squares as empty
	for ( let i = blockSquares.length; i < 5; i++ ) {
		blockSquares.push( 'empty' );
	}

	return (
		<VStack spacing={ 1 }>
			<HStack
				className="editor-revisions-sidebar-content__diff"
				spacing={ 2 }
				justify="flex-start"
			>
				<span className="diff-squares">
					{ blockSquares.map( ( type, i ) => (
						<span
							key={ i }
							className={ `diff-square is-${ type }` }
						/>
					) ) }
				</span>
				{ stats.blocksAdded > 0 && (
					<span className="is-added">+{ stats.blocksAdded }</span>
				) }
				{ stats.blocksModified > 0 && (
					<span className="is-modified">
						~{ stats.blocksModified }
					</span>
				) }
				{ stats.blocksRemoved > 0 && (
					<span className="is-removed">-{ stats.blocksRemoved }</span>
				) }
				<span className="editor-revisions-sidebar-content__diff-label">
					{ __( 'blocks' ) }
				</span>
			</HStack>
			<HStack
				className="editor-revisions-sidebar-content__diff"
				spacing={ 2 }
				justify="flex-start"
			>
				<span className="diff-squares">
					{ wordSquares.map( ( type, i ) => (
						<span
							key={ i }
							className={ `diff-square is-${ type }` }
						/>
					) ) }
				</span>
				{ stats.wordsAdded > 0 && (
					<span className="is-added">+{ stats.wordsAdded }</span>
				) }
				{ stats.wordsRemoved > 0 && (
					<span className="is-removed">-{ stats.wordsRemoved }</span>
				) }
				<span className="editor-revisions-sidebar-content__diff-label">
					{ __( 'words' ) }
				</span>
			</HStack>
		</VStack>
	);
}

export default function RevisionsSidebarContent( {
	diffStats,
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
			{ diffStats && <DiffStats stats={ diffStats } /> }
			<ExternalLink
				className="editor-revisions-sidebar-content__classic-link"
				href={ classicRevisionsUrl }
			>
				{ __( 'Open classic revisions screen' ) }
			</ExternalLink>
		</VStack>
	);
}
