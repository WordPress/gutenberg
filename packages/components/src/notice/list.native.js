/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import Notice from './';
import styles from './style.scss';
import { useCallback } from '@wordpress/element';

function NoticeList() {
	const { notices } = useSelect( ( select ) => {
		const { getNotices } = select( noticesStore );
		return {
			notices: getNotices(),
		};
	}, [] );

	const { removeNotice } = useDispatch( noticesStore );

	const onRemoveNotice = useCallback(
		( id ) => {
			removeNotice( id );
		},
		[ removeNotice ]
	);

	if ( ! notices.length ) {
		return null;
	}

	return (
		<View style={ styles.list }>
			{ notices.map( ( notice ) => {
				return (
					<Notice
						{ ...notice }
						key={ notice.id }
						onNoticeHidden={ onRemoveNotice }
					></Notice>
				);
			} ) }
		</View>
	);
}

export default NoticeList;
