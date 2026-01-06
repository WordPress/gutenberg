/**
 * External dependencies
 */
import type { ReactNode } from 'react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { NoticeList } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as noticesStore } from '../../store';

type NoticesDefaultListProps = {
	children?: ReactNode;
	pinnedNoticesClassName?: string;
	dismissibleNoticesClassName?: string;
};

export default function NoticesDefaultList( {
	children,
	pinnedNoticesClassName,
	dismissibleNoticesClassName,
}: NoticesDefaultListProps ) {
	const notices = useSelect( ( select ) =>
		select( noticesStore ).getNotices()
	);
	const { removeNotice } = useDispatch( noticesStore );
	const dismissibleNotices = notices.filter(
		( { isDismissible, type } ) => isDismissible && type === 'default'
	);
	const nonDismissibleNotices = notices.filter(
		( { isDismissible, type } ) => ! isDismissible && type === 'default'
	);

	return (
		<>
			<NoticeList
				// @ts-expect-error - NoticeList is not typed properly.
				notices={ nonDismissibleNotices }
				className={ clsx(
					'components-notices__pinned',
					pinnedNoticesClassName
				) }
			/>
			<NoticeList
				// @ts-expect-error - NoticeList is not typed properly.
				notices={ dismissibleNotices }
				className={ clsx(
					'components-notices__dismissible',
					dismissibleNoticesClassName
				) }
				onRemove={ removeNotice }
			>
				{ children }
			</NoticeList>
		</>
	);
}
