import type { Combobox as _Combobox } from '@base-ui/react/combobox';
import type { ReactElement } from 'react';

import type { ComponentProps } from '../../../utils/types';
import type { InputLayoutProps } from '../input-layout/types';

type ComboboxSize = Exclude< InputLayoutProps[ 'size' ], 'small' >;

export type ComboboxChipsProps = ComponentProps< typeof _Combobox.Chips > & {
	children?: React.ReactNode;
};

export type ComboboxChipWithRemoveProps = Omit<
	ComponentProps< typeof _Combobox.Chip >,
	// Replace the native HTML `prefix` attribute.
	'prefix'
> & {
	children?: React.ReactNode;
	/**
	 * Circular element to render before the chip content.
	 */
	prefix?: React.ReactNode;
	/**
	 * Accessible label for the remove button.
	 *
	 * @default __( 'Remove' )
	 */
	removeLabel?: string;
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
	 * The size of the item.
	 *
	 * @default 'default'
	 */
	size?: ComboboxSize;
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

export type PortalProps = ComponentProps< typeof _Combobox.Portal >;

export type PositionerProps = ComponentProps< typeof _Combobox.Positioner >;

export type ComboboxPopupProps = ComponentProps< typeof _Combobox.Popup > & {
	children?: React.ReactNode;
	/**
	 * Optional portal element, typically `<Combobox.Portal />` with custom
	 * `container`. When omitted, `Combobox.Popup` uses `Combobox.Portal` with
	 * default props. Do not pass `children` on the portal element; they would be
	 * ignored.
	 */
	portal?: ReactElement< Omit< PortalProps, 'children' > >;
	/**
	 * Optional positioner element, typically `<Combobox.Positioner />` with
	 * custom positioning props (`side`, `align`, `sideOffset`, collision
	 * settings, etc.). When omitted, `Combobox.Popup` uses
	 * `Combobox.Positioner` with default props. Do not pass `children` on the
	 * positioner element; they would be ignored.
	 */
	positioner?: ReactElement< Omit< PositionerProps, 'children' > >;
};

export type ComboboxRootProps<
	Value,
	Multiple extends boolean | undefined = false,
> = _Combobox.Root.Props< Value, Multiple >;

export type ComboboxTriggerProps = ComponentProps<
	typeof _Combobox.Trigger
> & {
	children?: _Combobox.Value.Props[ 'children' ];
	/**
	 * Text to show when no value is selected.
	 * This is overridden by `children` if specified, or by a null item's label in `items`.
	 *
	 * @default __( 'Select' )
	 */
	placeholder?: _Combobox.Value.Props[ 'placeholder' ];
	/**
	 * The size of the trigger.
	 *
	 * @default 'default'
	 */
	size?: ComboboxSize;
};

export type ComboboxValueProps = _Combobox.Value.Props;
