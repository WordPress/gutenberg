import type * as Ariakit from '@ariakit/react';
import type { CustomSelectOption, CustomSelectProps } from './types';

export type CustomSelectContext =
	| {
			store: Ariakit.SelectStore;
			size?: CustomSelectProps< CustomSelectOption >[ 'size' ];
	  }
	| undefined;

export type CustomSelectInternalProps = Pick<
	CustomSelectProps< CustomSelectOption >,
	'className' | 'hideLabelFromVision' | 'label' | 'size'
> & {
	store: Ariakit.SelectStore;
	children: React.ReactNode;
	renderSelectedValue: () => React.ReactNode;
};

export type CustomSelectItemProps = {
	value: string;
	children?: React.ReactNode;
};
