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

type InlineNoticesProps = {
	children?: ReactNode;
	className?: string;
	pinnedNoticesClassName?: string;
	dismissibleNoticesClassName?: string;
	context?: string;
};

function hasRenderableChildren( children: ReactNode ): boolean {
	return (
		children !== null &&
		children !== undefined &&
		children !== false &&
		children !== ''
	);
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
