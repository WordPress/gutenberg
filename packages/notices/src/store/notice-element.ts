import type { ReactNode } from 'react';
import { NOTICE_ELEMENT } from './constants';
import type { Notice } from './types';

/**
 * Puts each notice's private element, when it has one, in place of its
 * content for rendering.
 *
 * @param notices Notices from the store.
 * @return Notices to render.
 */
export function withNoticeElements( notices: Notice[] ): Notice[] {
	return notices.map( ( notice ) => {
		const element = ( notice as Record< symbol, unknown > )[
			NOTICE_ELEMENT
		];
		if ( element === undefined ) {
			return notice;
		}
		return {
			...notice,
			content: element as ReactNode as string,
			__unstableHTML: false,
		};
	} );
}
