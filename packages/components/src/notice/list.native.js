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

function NoticeList() {
	const { notices } = useSelect( ( select ) => {
		const { getNotices } = select( noticesStore );
		return {
			notices: getNotices(),
		};
	}, [] );

	const { removeNotice } = useDispatch( noticesStore );

	function onRemoveNotice( id ) {
		removeNotice( id );
	}

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
