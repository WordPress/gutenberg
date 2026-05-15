import type { Select as _Select } from '@base-ui/react/select';
import type { ReactElement } from 'react';

import type { ComponentProps } from '../../../utils/types';
import type { InputLayoutProps } from '../input-layout/types';

export type PortalProps = ComponentProps< typeof _Select.Portal >;

export type PositionerProps = ComponentProps< typeof _Select.Positioner >;

// The second type parameter is the `multiple` flag (currently disabled).
export type SelectRootProps< Value = unknown > = Omit<
	_Select.Root.Props< Value, false >,
	'multiple'
>;

export type SelectTriggerProps = ComponentProps< typeof _Select.Trigger > & {
	/**
	 * The size of the trigger.
	 *
	 * @default 'default'
	 */
	size?: InputLayoutProps[ 'size' ];
	/**
	 * The style variant of the trigger.
	 *
	 * @default 'default'
	 */
	variant?: 'default' | 'minimal';
	/**
	 * Text to show when no value is selected.
	 * This is overridden by `children` if specified, or by a null item's label in `items`.
	 *
	 * @default __( 'Select' )
	 */
	placeholder?: _Select.Value.Props[ 'placeholder' ];
	/**
	 * A function that gets called with the current value as an argument.
	 * Use this to customize the trigger content.
	 *
	 * When no value is selected, the rendered content inherits the
	 * placeholder text color.
	 */
	children?: _Select.Value.Props[ 'children' ];
};

export type SelectPopupProps = ComponentProps< typeof _Select.Popup > & {
	/**
	 * The content to be rendered inside the popup.
	 */
	children?: React.ReactNode;
	/**
	 * Optional portal element, typically `<Select.Portal />` with custom
	 * `container`. When omitted, `Select.Popup` uses `Select.Portal` with
	 * default props. Do not pass `children` on the portal element; they would
	 * be ignored.
	 */
	portal?: ReactElement< Omit< PortalProps, 'children' > >;
	/**
	 * Optional positioner element, typically `<Select.Positioner />` with
	 * custom positioning props (`side`, `align`, `sideOffset`, collision
	 * settings, etc.). When omitted, `Select.Popup` uses `Select.Positioner`
	 * with default props. Do not pass `children` on the positioner element;
	 * they would be ignored.
	 */
	positioner?: ReactElement< Omit< PositionerProps, 'children' > >;
};

export type SelectItemProps = Omit<
	ComponentProps< typeof _Select.Item >,
	'value'
> & {
	/**
	 * A unique value that identifies this select item.
	 */
	value?: unknown;
	/**
	 * The size of the item.
	 *
	 * @default 'default'
	 */
	size?: InputLayoutProps[ 'size' ];
	/**
	 * The content of the item.
	 */
	children?: _Select.Item.Props[ 'children' ];
};
