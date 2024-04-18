/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	PanelBody,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import { decodeEntities } from '@wordpress/html-entities';
import { count as wordCount } from '@wordpress/wordcount';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
} from '../../store/constants';
import { unlock } from '../../lock-unlock';
import TemplateAreas from '../template-areas';

export default function PostCardPanel( { className, actions } ) {
	const { modified, title, templateInfo, icon, postType, isPostsPage } =
		useSelect( ( select ) => {
			const {
				getEditedPostAttribute,
				getCurrentPostType,
				getCurrentPostId,
				__experimentalGetTemplateInfo,
			} = select( editorStore );
			const { getEditedEntityRecord, getEntityRecord } =
				select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );
			const _type = getCurrentPostType();
			const _id = getCurrentPostId();
			const _record = getEditedEntityRecord( 'postType', _type, _id );
			const _templateInfo = __experimentalGetTemplateInfo( _record );
			return {
				title:
					_templateInfo?.title || getEditedPostAttribute( 'title' ),
				modified: getEditedPostAttribute( 'modified' ),
				id: _id,
				postType: _type,
				templateInfo: _templateInfo,
				icon: unlock( select( editorStore ) ).getPostIcon( _type, {
					area: _record?.area,
				} ),
				isPostsPage: +_id === siteSettings?.page_for_posts,
			};
		}, [] );
	const description = templateInfo?.description;
	const lastEditedText =
		modified &&
		sprintf(
			// translators: %s: Human-readable time difference, e.g. "2 days ago".
			__( 'Last edited %s.' ),
			humanTimeDiff( modified )
		);
	const showPostContentInfo =
		! isPostsPage &&
		! [ TEMPLATE_POST_TYPE, TEMPLATE_PART_POST_TYPE ].includes( postType );
	return (
		<PanelBody>
			<div
				className={ classnames( 'editor-post-card-panel', className ) }
			>
				<HStack
					spacing={ 2 }
					className="editor-post-card-panel__header"
					align="flex-start"
				>
					<Icon
						className="editor-post-card-panel__icon"
						icon={ icon }
					/>
					<Text
						numberOfLines={ 2 }
						truncate
						className="editor-post-card-panel__title"
						weight={ 500 }
						as="h2"
					>
						{ title ? decodeEntities( title ) : __( 'No Title' ) }
					</Text>
					{ actions }
				</HStack>
				<VStack className="editor-post-card-panel__content">
					{ ( description ||
						lastEditedText ||
						showPostContentInfo ) && (
						<VStack
							className="editor-post-card-panel__description"
							spacing={ 2 }
						>
							{ description && <Text>{ description }</Text> }
							{ showPostContentInfo && <PostContentInfo /> }
							{ lastEditedText && (
								<Text>{ lastEditedText }</Text>
							) }
						</VStack>
					) }
					{ postType === TEMPLATE_POST_TYPE && <TemplateAreas /> }
				</VStack>
			</div>
		</PanelBody>
	);
}

// Taken from packages/editor/src/components/time-to-read/index.js.
const AVERAGE_READING_RATE = 189;

// This component renders the wordcount and reading time for the post.
function PostContentInfo() {
	const postContent = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'content' ),
		[]
	);
	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );
	const wordsCounted = useMemo(
		() => ( postContent ? wordCount( postContent, wordCountType ) : 0 ),
		[ postContent, wordCountType ]
	);
	if ( ! wordsCounted ) {
		return null;
	}
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
					// translators: %s: the number of minutes to read the post.
					_n( '%s minute', '%s minutes', readingTime ),
					readingTime.toLocaleString()
			  );
	return (
		<Text>
			{ sprintf(
				/* translators: 1: How many words a post has. 2: the number of minutes to read the post (e.g. 130 words, 2 minutes read time.) */
				__( '%1$s, %2$s read time.' ),
				wordsCountText,
				minutesText
			) }
		</Text>
	);
}
