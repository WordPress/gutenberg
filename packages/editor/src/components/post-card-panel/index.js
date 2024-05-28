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

export default function PostCardPanel( { actions } ) {
	const { title, icon, isSync } = useSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			getCurrentPostType,
			getCurrentPostId,
			__experimentalGetTemplateInfo,
		} = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );
		const _type = getCurrentPostType();
		const _id = getCurrentPostId();
		const _record = getEditedEntityRecord( 'postType', _type, _id );
		const _templateInfo =
			[ TEMPLATE_POST_TYPE, TEMPLATE_PART_POST_TYPE ].includes( _type ) &&
			__experimentalGetTemplateInfo( _record );
		let _isSync = false;
		if ( GLOBAL_POST_TYPES.includes( _type ) ) {
			if ( PATTERN_POST_TYPE === _type ) {
				// When the post is first created, the top level wp_pattern_sync_status is not set so get meta value instead.
				const currentSyncStatus =
					getEditedPostAttribute( 'meta' )?.wp_pattern_sync_status ===
					'unsynced'
						? 'unsynced'
						: getEditedPostAttribute( 'wp_pattern_sync_status' );
				_isSync = currentSyncStatus !== 'unsynced';
			} else {
				_isSync = true;
			}
		}
		return {
			title: _templateInfo?.title || getEditedPostAttribute( 'title' ),
			icon: unlock( select( editorStore ) ).getPostIcon( _type, {
				area: _record?.area,
			} ),
			isSync: _isSync,
		};
	}, [] );
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
				>
					{ title ? decodeEntities( title ) : __( 'No Title' ) }
				</Text>
				{ actions }
			</HStack>
		</div>
	);
}
