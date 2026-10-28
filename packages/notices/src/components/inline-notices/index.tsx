import type { ReactNode } from 'react';
import clsx from 'clsx';
import { useDispatch, useSelect } from '@wordpress/data';
import { Children, useState } from '@wordpress/element';
import { Notice } from '@wordpress/ui';
import { store as noticesStore } from '../../store';
import type { Notice as NoticeType } from '../../store/types';
import InlineNotice from './inline-notice';

type InlineNoticesProps = {
	children?: ReactNode;
	className?: string;
	pinnedNoticesClassName?: string;
	dismissibleNoticesClassName?: string;
	context?: string;
};

type NoticeListProps = {
	notices: NoticeType[];
	className: string;
	getAnnouncementKey: ( notice: NoticeType ) => number;
	onRemove?: ( id: string ) => void;
	children?: ReactNode;
};

function createAnnouncementKeyGenerator() {
	const announcementKeys = new WeakMap< NoticeType, number >();
	let nextAnnouncementKey = 0;
	return ( notice: NoticeType ) => {
		let key = announcementKeys.get( notice );
		if ( key === undefined ) {
			key = nextAnnouncementKey++;
			announcementKeys.set( notice, key );
		}
		return key;
	};
}

function NoticeList( {
	notices,
	className,
	getAnnouncementKey,
	onRemove,
	children,
}: NoticeListProps ) {
	return (
		<div className={ clsx( 'notices-inline-notices__list', className ) }>
			{ children }
			{ [ ...notices ].reverse().map( ( notice ) => (
				<InlineNotice
					key={ notice.id }
					announcementKey={ getAnnouncementKey( notice ) }
					notice={ notice }
					onRemove={ () => onRemove?.( notice.id ) }
				/>
			) ) }
		</div>
	);
}

function hasRenderableChildren( children: ReactNode ): boolean {
	return Children.toArray( children ).some( ( child ) => child !== '' );
}

export default function InlineNotices( {
	children,
	className,
	pinnedNoticesClassName,
	dismissibleNoticesClassName,
	context,
}: InlineNoticesProps ) {
	const [ getAnnouncementKey ] = useState( createAnnouncementKeyGenerator );
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

	const hasPinnedNotices = nonDismissibleNotices.length > 0;
	const hasDismissibleNotices =
		dismissibleNotices.length > 0 || hasRenderableChildren( children );

	return (
		// Keep live regions mounted without adding a box to the notice layout.
		<Notice.List style={ { display: 'contents' } }>
			{ ( hasPinnedNotices || hasDismissibleNotices ) && (
				<div
					className={ clsx(
						'notices-inline-notices-wrapper',
						className
					) }
				>
					{ hasPinnedNotices && (
						<NoticeList
							notices={ nonDismissibleNotices }
							getAnnouncementKey={ getAnnouncementKey }
							className={ clsx(
								'components-notices__pinned',
								pinnedNoticesClassName
							) }
						/>
					) }
					{ hasDismissibleNotices && (
						<NoticeList
							notices={ dismissibleNotices }
							getAnnouncementKey={ getAnnouncementKey }
							className={ clsx(
								'components-notices__dismissible',
								dismissibleNoticesClassName
							) }
							onRemove={ ( id ) => removeNotice( id, context ) }
						>
							{ children }
						</NoticeList>
					) }
				</div>
			) }
		</Notice.List>
	);
}
