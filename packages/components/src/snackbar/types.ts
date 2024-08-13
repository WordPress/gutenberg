/**
 * External dependencies
 */
import type { MutableRefObject, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type {
	NoticeProps,
	NoticeChildren,
	NoticeAction,
} from '../notice/types';

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

export type SnackbarProps = Pick<
	NoticeProps,
	| 'className'
	| 'children'
	| 'spokenMessage'
	| 'onRemove'
	| 'politeness'
	| 'onDismiss'
> &
	SnackbarOnlyProps & {
		/**
		 * An array of action objects. Each member object should contain:
		 *
		 * - `label`: `string` containing the text of the button/link
		 * - `url`: `string` OR `onClick`: `( event: SyntheticEvent ) => void` to specify
		 *    what the action does.
		 *
		 * The default appearance of an action button is inferred based on whether
		 * `url` or `onClick` are provided, rendering the button as a link if
		 * appropriate. If both props are provided, `url` takes precedence, and the
		 * action button will render as an anchor tag.
		 *
		 * @default []
		 */
		actions?: Pick< NoticeAction, 'label' | 'url' | 'onClick' >[];
	};

export type SnackbarListProps = {
	notices: Array<
		Omit< SnackbarProps, 'children' > & {
			id: string;
			content: string;
		}
	>;
	onRemove: ( id: string ) => void;
	children?: NoticeChildren | Array< NoticeChildren >;
};
