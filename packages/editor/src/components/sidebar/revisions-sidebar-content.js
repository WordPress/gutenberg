/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PostCardPanel from '../post-card-panel';

export default function RevisionsSidebarContent( { diffStats, revisionDate } ) {
	const { postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
		};
	}, [] );

	const stats = diffStats || {
		wordsAdded: 0,
		wordsRemoved: 0,
		blocksAdded: 0,
		blocksRemoved: 0,
		blocksModified: 0,
	};

	const dateSettings = getDateSettings();
	const formattedDate = revisionDate
		? dateI18n( dateSettings.formats.datetime, revisionDate )
		: '';

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
		<VStack className="editor-revisions-sidebar-content" spacing={ 4 }>
			<PostCardPanel postType={ postType } postId={ postId } />
			{ formattedDate && (
				<HStack
					className="editor-revisions-sidebar-content__row"
					alignment="flex-start"
				>
					<div className="editor-revisions-sidebar-content__label">
						{ __( 'Date' ) }
					</div>
					<div className="editor-revisions-sidebar-content__value">
						{ formattedDate }
					</div>
				</HStack>
			) }
			<HStack
				className="editor-revisions-sidebar-content__row"
				alignment="flex-start"
			>
				<div className="editor-revisions-sidebar-content__label">
					{ __( 'Blocks' ) }
				</div>
				<HStack
					className="editor-revisions-sidebar-content__value"
					spacing={ 2 }
					justify="flex-end"
				>
					{ stats.blocksAdded > 0 && (
						<span className="is-added">+{ stats.blocksAdded }</span>
					) }
					{ stats.blocksModified > 0 && (
						<span className="is-modified">
							~{ stats.blocksModified }
						</span>
					) }
					{ stats.blocksRemoved > 0 && (
						<span className="is-removed">
							-{ stats.blocksRemoved }
						</span>
					) }
					<span className="diff-squares">
						{ blockSquares.map( ( type, i ) => (
							<span
								key={ i }
								className={ `diff-square is-${ type }` }
							/>
						) ) }
					</span>
				</HStack>
			</HStack>
			<HStack
				className="editor-revisions-sidebar-content__row"
				alignment="flex-start"
			>
				<div className="editor-revisions-sidebar-content__label">
					{ __( 'Words' ) }
				</div>
				<HStack
					className="editor-revisions-sidebar-content__value"
					spacing={ 2 }
					justify="flex-end"
				>
					{ stats.wordsAdded > 0 && (
						<span className="is-added">+{ stats.wordsAdded }</span>
					) }
					{ stats.wordsRemoved > 0 && (
						<span className="is-removed">
							-{ stats.wordsRemoved }
						</span>
					) }
					<span className="diff-squares">
						{ wordSquares.map( ( type, i ) => (
							<span
								key={ i }
								className={ `diff-square is-${ type }` }
							/>
						) ) }
					</span>
				</HStack>
			</HStack>
		</VStack>
	);
}
