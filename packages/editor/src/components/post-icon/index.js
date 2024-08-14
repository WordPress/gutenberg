/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { PATTERN_POST_TYPE, GLOBAL_POST_TYPES } from '../../store/constants';
import { unlock } from '../../lock-unlock';

export default function PostIcon( { postType, postId } ) {
	const { icon, isSync } = useSelect(
		( select ) => {
			const { getEditedEntityRecord } = select( coreStore );
			const _record = getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
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
				icon: unlock( select( editorStore ) ).getPostIcon( postType, {
					area: _record?.area,
				} ),
				isSync: _isSync,
			};
		},
		[ postId, postType ]
	);
	return (
		<Icon
			className={ clsx( 'editor-post-icon', {
				'is-sync': isSync,
			} ) }
			icon={ icon }
		/>
	);
}
