// TODO
/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as Ariakit from '@ariakit/react';

export type CustomSelectContextProps =
	| {
			store: Ariakit.SelectStore;
	  }
	| undefined;

export type CustomSelectProps = {
	children: React.ReactNode;
	label?: string;
	onChange?: Function;
	value?: string;
};

export type CustomSelectItemProps = {
	children: React.ReactNode;
};
