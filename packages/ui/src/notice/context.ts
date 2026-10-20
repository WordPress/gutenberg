import { createContext } from '@wordpress/element';
import type { RootProps } from './types';

export type Announcement = {
	message: string;
	politeness: NonNullable< RootProps[ 'politeness' ] >;
};

export const NoticeListContext = createContext<
	( ( id: string, read: () => Announcement ) => () => void ) | null
>( null );
