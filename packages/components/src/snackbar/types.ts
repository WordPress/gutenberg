/**
 * External dependencies
 */
import type { MutableRefObject } from 'react';

/**
 * WordPress dependencies
 */
import type { WPElement } from '@wordpress/element';

export type Action = {
	label: string;
	url: string;
	onClick?: ( event: Event ) => {};
};

export type SnackbarProps = {
	className?: string;
	children: string;
	spokenMessage?: string | WPElement;
	politeness?: 'polite' | 'assertive';
	actions?: Array< Action >;
	onRemove?: Function;
	icon?: WPElement | null;
	explicitDismiss?: boolean;
	onDismiss?: Function;
	listRef?: MutableRefObject< HTMLDivElement >;
};

export type Notice = {
	id: string;
	status: string;
	content: string;
	spokenMessage: string | WPElement;
	__unstableHTML?: string;
	isDismissible: boolean;
	actions: Array< Action >;
	type: string;
	icon?: WPElement;
	explicitDismiss: boolean;
	onDismiss: Function;
};

export type SnackbarListProps = {
	notices: Array< Notice >;
	children?: Array< string >;
	onRemove?: Function;
	className?: string;
};
