import type { ReactNode } from 'react';
import clsx from 'clsx';
import { useDispatch, useSelect } from '@wordpress/data';
import { Children } from '@wordpress/element';
import { store as noticesStore } from '../../store';
import type { Notice } from '../../store/types';
import InlineNotice from './inline-notice';

type InlineNoticesProps = {
	children?: ReactNode;
	className?: string;
	pinnedNoticesClassName?: string;
	dismissibleNoticesClassName?: string;
	context?: string;
};

type NoticeListProps = {
	notices: Notice[];
	className: string;
	onRemove?: ( id: string ) => void;
	children?: ReactNode;
};

function NoticeList( {
	notices,
	className,
	onRemove,
	children,
}: NoticeListProps ) {
	return (
		<div className={ clsx( 'notices-inline-notices__list', className ) }>
			{ children }
			{ [ ...notices ].reverse().map( ( notice ) => (
				<InlineNotice
					key={ notice.id }
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

	if ( ! hasPinnedNotices && ! hasDismissibleNotices ) {
		return null;
	}

	return (
		<div className={ clsx( 'notices-inline-notices-wrapper', className ) }>
			{ hasPinnedNotices && (
				<NoticeList
					notices={ nonDismissibleNotices }
					className={ clsx(
						'components-notices__pinned',
						pinnedNoticesClassName
					) }
				/>
			) }
			{ hasDismissibleNotices && (
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
			) }
		</div>
	);
}
