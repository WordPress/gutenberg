/**
 * External dependencies
 */
import type { MutableRefObject, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { NoticeProps, NoticeChildren } from '../notice/types';

type SnackbarOnlyProps = {
	/**
	 * The icon to render in the snackbar.
	 *
	 * @default null
	 */
	icon?: ReactNode;
	/**
	 * Whether to require user action to dismiss the snackbar.
	 * By default, this is dismissed on a timeout, without user interaction.
	 *
	 * @default false
	 */
	explicitDismiss?: boolean;
	/**
	 * A ref to the list that contains the snackbar.
	 */
	listRef?: MutableRefObject< HTMLDivElement | null >;
};

export type SnackbarProps = Omit< NoticeProps, '__unstableHTML' > &
	SnackbarOnlyProps;

export type SnackbarListProps = {
	notices: Array<
		Omit< SnackbarProps, 'children' > & {
			id: string;
			content: string;
		}
	>;
	maxVisible?: number;
	onRemove: ( id: string ) => void;
	children?: NoticeChildren | Array< NoticeChildren >;
};
