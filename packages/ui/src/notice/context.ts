import { createContext, useContext } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import type { RootProps } from './types';

export type Announcement = {
	message: string;
	politeness: NonNullable< RootProps[ 'politeness' ] >;
};

export const NoticeListContext = createContext< {
	register: ( id: string, read: () => Announcement ) => () => void;
	update: () => void;
} | null >( null );

export const NoticeTextContext = createContext< {
	register: (
		element: HTMLElement,
		kind: 'title' | 'description'
	) => () => void;
} | null >( null );

export function useNoticeText( kind: 'title' | 'description' ) {
	const context = useContext( NoticeTextContext );
	return useRefEffect< HTMLSpanElement >(
		( element ) => context?.register( element, kind ),
		[ context, kind ]
	);
}
