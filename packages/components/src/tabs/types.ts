/**
 * External dependencies
 */
import type { ReactNode } from 'react';
/**
 * Internal dependencies
 */
import type { IconType } from '../icon';

export type TabValue = string;

export type TabsListProps = {
	className?: string;
	children?: ReactNode;
};

export type TabProps = {
	value: TabValue;
	title: string;
	disabled?: boolean;
	className?: string;
	children?: ReactNode;
	icon?: IconType;
};

export type TabPanelProps = {
	value: TabValue;
	className?: string;
	children?: ReactNode;
};

export type TabsProps = {
	defaultValue?: TabValue;
	value?: TabValue;
	onValueChange: ( value: TabValue ) => void;
	children?: ReactNode;
	className?: string;
	orientation?: 'horizontal' | 'vertical';
};
