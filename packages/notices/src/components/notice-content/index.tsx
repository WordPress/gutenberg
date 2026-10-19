import type { ReactNode } from 'react';
import { Fill, Slot } from '@wordpress/components';

const slotNames = new Map< string, symbol >();

/**
 * Creates a fill that adds content after the message of the notice with the
 * given ID, while that notice is shown. The notice's text stays the same, so
 * the added content isn't announced or copied.
 *
 * @param noticeId The notice's ID.
 *
 * @return The fill component.
 */
export function createNoticeContentFill( noticeId: string ) {
	const name = Symbol( `NoticeContent ${ noticeId }` );
	slotNames.set( noticeId, name );
	return function NoticeContentFill( { children }: { children: ReactNode } ) {
		return <Fill name={ name }>{ children }</Fill>;
	};
}

/**
 * Renders the content added to a notice's message, for notices that have a
 * fill. Other notices render no slot, so they work without a
 * `SlotFillProvider`.
 *
 * @param props          Component props.
 * @param props.noticeId The notice's ID.
 */
export function NoticeContentSlot( { noticeId }: { noticeId: string } ) {
	const name = slotNames.get( noticeId );
	return name ? <Slot name={ name } /> : null;
}
