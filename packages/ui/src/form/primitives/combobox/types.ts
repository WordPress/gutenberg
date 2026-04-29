import type { Combobox as _Combobox } from '@base-ui/react/combobox';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';

import type { ComponentProps } from '../../../utils/types';

export type ComboboxChipsProps = ComponentProps< typeof _Combobox.Chips > & {
	children?: React.ReactNode;
};

export type ComboboxChipWithRemoveProps = Omit<
	ComponentProps< typeof _Combobox.Chip >,
	'prefix'
> & {
	children?: React.ReactNode;
	/**
	 * Circular element to render before the chip content.
	 */
	prefix?: React.ReactNode;
};

export type ComboboxClearProps = ComponentProps< typeof _Combobox.Clear > & {
	children?: React.ReactNode;
};

export type ComboboxCollectionProps = _Combobox.Collection.Props;

export type ComboboxEmptyProps = ComponentProps< typeof _Combobox.Empty > & {
	children?: React.ReactNode;
};

export type ComboboxInputProps = Omit<
	ComponentProps< typeof _Combobox.Input >,
	'size'
>;

export type ComboboxItemProps = ComponentProps< typeof _Combobox.Item > & {
	children?: React.ReactNode;
	/**
	 * The variant of the item.
	 *
	 * - `'default'`: A standard item.
	 * - `'creatable'`: An item that triggers the creation of a new item.
	 *
	 * @default 'default'
	 */
	variant?: 'default' | 'creatable';
};

export type ComboboxListProps = ComponentProps< typeof _Combobox.List > & {
	children?: _Combobox.List.Props[ 'children' ];
};

export type ComboboxListBodyProps = ComponentProps< 'div' > & {
	children?: React.ReactNode;
};

export type ComboboxListFooterProps = ComponentProps< 'div' > & {
	children?: React.ReactNode;
};

export type PortalProps = ComponentPropsWithoutRef< typeof _Combobox.Portal >;

export type ComboboxPopupProps = ComponentProps< typeof _Combobox.Popup > & {
	children?: React.ReactNode;
	/**
	 * Optional portal element, typically `<Combobox.Portal />` with custom
	 * `container`. When omitted, `Combobox.Popup` uses `Combobox.Portal` with
	 * default props. Do not pass `children` on the portal element; they would be
	 * ignored.
	 */
	portal?: ReactElement< Omit< PortalProps, 'children' > >;
};

export type ComboboxRootProps<
	Value,
	Multiple extends boolean | undefined = false,
> = ComponentProps< typeof _Combobox.Root< Value, Multiple > > & {
	children?: React.ReactNode;
};

export type ComboboxTriggerProps = ComponentProps<
	typeof _Combobox.Trigger
> & {
	children?: _Combobox.Value.Props[ 'children' ];
};

export type ComboboxValueProps = {
	/**
	 * Can be used to override the current value of the combobox.
	 */
	children?: _Combobox.Value.Props[ 'children' ];
};
