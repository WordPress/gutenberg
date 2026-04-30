import type { Select as _Select } from '@base-ui/react/select';
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';

import type { ComponentProps } from '../../../utils/types';
import type { InputLayoutProps } from '../input-layout/types';

export type PortalProps = ComponentPropsWithoutRef< typeof _Select.Portal >;

// The second type parameter is the `multiple` flag (currently disabled).
export type SelectRootProps< Value = string > = Omit<
	_Select.Root.Props< Value, false >,
	'multiple'
>;

export type SelectTriggerProps< Value = string > = Omit<
	ComponentProps< typeof _Select.Trigger >,
	'children'
> & {
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
	 * A function that gets called with the current value as an argument.
	 * Use this to customize the trigger content.
	 */
	children?: ReactNode | ( ( value: Value | null ) => ReactNode );
};

export type SelectPopupProps = ComponentProps< typeof _Select.Popup > & {
	/**
	 * The content to be rendered inside the popup.
	 */
	children?: ReactNode;
	/**
	 * Optional portal element, typically `<Select.Portal />` with custom
	 * `container`. When omitted, `Select.Popup` uses `Select.Portal` with
	 * default props. Do not pass `children` on the portal element; they would
	 * be ignored.
	 */
	portal?: ReactElement< Omit< PortalProps, 'children' > >;
};

export type SelectItemProps< Value = string > = Omit<
	ComponentProps< typeof _Select.Item >,
	'value' | 'children'
> & {
	/**
	 * A unique value that identifies this select item.
	 */
	value?: Value;
	/**
	 * The size of the item.
	 *
	 * @default 'default'
	 */
	size?: InputLayoutProps[ 'size' ];
	/**
	 * The content of the item.
	 *
	 * @default `value`
	 */
	children?: ReactNode;
};
