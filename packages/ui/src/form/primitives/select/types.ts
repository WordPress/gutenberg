import type { Select as _Select } from '@base-ui/react/select';
import type { InputLayoutProps } from '../input-layout/types';

// The second type parameter is the `multiple` flag (currently disabled).
export type SelectRootProps = Omit<
	_Select.Root.Props< string, false >,
	'multiple'
>;

export type SelectTriggerProps = Omit< _Select.Trigger.Props, 'children' > & {
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
	children?: _Select.Value.Props[ 'children' ];
};

export type SelectPopupProps = _Select.Popup.Props;

export type SelectItemProps = Omit<
	_Select.Item.Props,
	'children' | 'value'
> & {
	/**
	 * A unique value that identifies this select item.
	 */
	value?: string;
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
	children?: _Select.Item.Props[ 'children' ];
};
