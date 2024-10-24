/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
	GLOBAL_POST_TYPES,
} from '../../store/constants';
import { unlock } from '../../lock-unlock';
import PostActions from '../post-actions';
import usePageTypeBadge from '../../utils/pageTypeBadge';

export default function PostCardPanel( {
	postType,
	postId,
	onActionPerformed,
} ) {
	const { title, icon, isSync } = useSelect(
		( select ) => {
			const { __experimentalGetTemplateInfo } = select( editorStore );
			const { getEditedEntityRecord } = select( coreStore );
			const _record = getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
			const _templateInfo =
				[ TEMPLATE_POST_TYPE, TEMPLATE_PART_POST_TYPE ].includes(
					postType
				) && __experimentalGetTemplateInfo( _record );
			let _isSync = false;
			if ( GLOBAL_POST_TYPES.includes( postType ) ) {
				if ( PATTERN_POST_TYPE === postType ) {
					// When the post is first created, the top level wp_pattern_sync_status is not set so get meta value instead.
					const currentSyncStatus =
						_record?.meta?.wp_pattern_sync_status === 'unsynced'
							? 'unsynced'
							: _record?.wp_pattern_sync_status;
					_isSync = currentSyncStatus !== 'unsynced';
				} else {
					_isSync = true;
				}
			}
			return {
				title: _templateInfo?.title || _record?.title,
				icon: unlock( select( editorStore ) ).getPostIcon( postType, {
					area: _record?.area,
				} ),
				isSync: _isSync,
			};
		},
		[ postId, postType ]
	);

	const pageTypeBadge = usePageTypeBadge();

	return (
		<div className="editor-post-card-panel">
			<HStack
				spacing={ 2 }
				className="editor-post-card-panel__header"
				align="flex-start"
			>
				<Icon
					className={ clsx( 'editor-post-card-panel__icon', {
						'is-sync': isSync,
					} ) }
					icon={ icon }
				/>
				<Text
					numberOfLines={ 2 }
					truncate
					className="editor-post-card-panel__title"
					weight={ 500 }
					as="h2"
					lineHeight="20px"
				>
					{ title ? decodeEntities( title ) : __( 'No title' ) }
					{ pageTypeBadge && (
						<span className="editor-post-card-panel__title-badge">
							{ pageTypeBadge }
						</span>
					) }
				</Text>
				<PostActions
					postType={ postType }
					postId={ postId }
					onActionPerformed={ onActionPerformed }
				/>
			</HStack>
		</div>
	);
}
