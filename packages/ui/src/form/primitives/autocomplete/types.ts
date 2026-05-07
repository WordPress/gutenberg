import type { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import type { ComponentProps } from '../../../utils/types';

export type AutocompleteCollectionProps = _Autocomplete.Collection.Props;

export type PortalProps = ComponentPropsWithoutRef<
	typeof _Autocomplete.Portal
>;

export type AutocompleteClearProps = ComponentProps<
	typeof _Autocomplete.Clear
> & {
	children?: React.ReactNode;
};

export type AutocompleteEmptyProps = ComponentProps<
	typeof _Autocomplete.Empty
> & {
	children?: React.ReactNode;
};

export type AutocompleteInputProps = Omit<
	ComponentProps< typeof _Autocomplete.Input >,
	'size'
>;

export type AutocompleteInputGroupProps = ComponentProps<
	typeof _Autocomplete.InputGroup
> & {
	children?: React.ReactNode;
};

export type AutocompleteItemProps = ComponentProps<
	typeof _Autocomplete.Item
> & {
	children?: React.ReactNode;
};

export type AutocompleteListProps = ComponentProps<
	typeof _Autocomplete.List
> & {
	children?: _Autocomplete.List.Props[ 'children' ];
};

export type AutocompleteListBodyProps = ComponentProps< 'div' > & {
	children?: React.ReactNode;
};

export type AutocompletePopupProps = ComponentProps<
	typeof _Autocomplete.Popup
> & {
	children?: React.ReactNode;
	/**
	 * Optional portal element, typically `<Autocomplete.Portal />` with custom
	 * `container`. When omitted, `Autocomplete.Popup` uses
	 * `Autocomplete.Portal` with default props. Do not pass `children` on the
	 * portal element; they would be ignored.
	 */
	portal?: ReactElement< Omit< PortalProps, 'children' > >;
};

export type AutocompleteRootProps = ComponentProps<
	typeof _Autocomplete.Root
> & {
	children?: React.ReactNode;
};

export type AutocompleteValueProps = {
	/**
	 * Can be used to override the current value of the autocomplete.
	 */
	children?: _Autocomplete.Value.Props[ 'children' ];
};
