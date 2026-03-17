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
import './style.scss';

type InlineNoticesProps = {
	children?: ReactNode;
	pinnedNoticesClassName?: string;
	dismissibleNoticesClassName?: string;
	context?: string;
};

export default function InlineNotices( {
	children,
	pinnedNoticesClassName,
	dismissibleNoticesClassName,
	context,
}: InlineNoticesProps ) {
	const notices = useSelect(
		( select ) => select( noticesStore ).getNotices( context ),
		[ context ]
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
				notices={ nonDismissibleNotices }
				className={ clsx(
					'components-notices__pinned',
					pinnedNoticesClassName
				) }
			/>
			<NoticeList
				notices={ dismissibleNotices }
				className={ clsx(
					'components-notices__dismissible',
					dismissibleNoticesClassName
				) }
				onRemove={ ( id ) => removeNotice( id, context ) }
			>
				{ children }
			</NoticeList>
		</>
	);
}
