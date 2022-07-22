/**
 * External dependencies
 */
import type { MutableRefObject } from 'react';

/**
 * WordPress dependencies
 */
import type { WPElement } from '@wordpress/element';

export type SnackbarProps = {
	className?: string;
	children: string;
	spokenMessage?: string;
	politeness?: 'polite' | 'assertive';
	actions?: Array< Record< string, any > >;
	onRemove?: Function;
	icon?: WPElement | null;
	explicitDismiss?: boolean;
	onDismiss?: Function;
	listRef?: MutableRefObject< HTMLDivElement >;
};

export type Notice = {
	id: string | number;
	content: string;
};

export type SnackbarListProps = {
	notices: Array< Notice >;
	onRemove: Function;
	className: string;
	children: Array< string >;
};
