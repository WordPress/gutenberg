import type { ReactNode } from 'react';
import clsx from 'clsx';
import { NoticeList } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { Children } from '@wordpress/element';
import { store as noticesStore } from '../../store';

type InlineNoticesProps = {
	children?: ReactNode;
	className?: string;
	pinnedNoticesClassName?: string;
	dismissibleNoticesClassName?: string;
	context?: string;
};

function hasRenderableChildren( children: ReactNode ): boolean {
	// `Children.toArray` flattens the array that more than one child arrives
	// as, and drops the nothings along the way — `null`, `undefined` and the
	// booleans a `&&` leaves behind — so only the empty string is left to
	// check for.
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
