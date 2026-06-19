import type { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import type { ReactElement } from 'react';
import type { ComponentProps } from '../../../utils/types';

export type AutocompleteCollectionProps = _Autocomplete.Collection.Props;

export type PortalProps = ComponentProps< typeof _Autocomplete.Portal >;

export type PositionerProps = ComponentProps< typeof _Autocomplete.Positioner >;

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

export type AutocompleteGroupProps = ComponentProps<
	typeof _Autocomplete.Group
> & {
	children?: React.ReactNode;
};

export type AutocompleteGroupLabelProps = ComponentProps<
	typeof _Autocomplete.GroupLabel
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
	/**
	 * Optional positioner element, typically `<Autocomplete.Positioner />`
	 * with custom positioning props (`side`, `align`, `sideOffset`, collision
	 * settings, etc.). When omitted, `Autocomplete.Popup` uses
	 * `Autocomplete.Positioner` with default props. Do not pass `children` on
	 * the positioner element; they would be ignored.
	 */
	positioner?: ReactElement< Omit< PositionerProps, 'children' > >;
};

export type AutocompleteRootProps< Value = unknown > =
	_Autocomplete.Root.Props< Value >;

export type AutocompleteValueProps = _Autocomplete.Value.Props;
