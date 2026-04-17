import type { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import type { ComponentProps } from '../../../utils/types';

export type AutocompleteCollectionProps = _Autocomplete.Collection.Props;

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
