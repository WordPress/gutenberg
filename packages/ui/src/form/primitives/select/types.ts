import type { Select as _Select } from '@base-ui/react/select';
import type { ComponentProps } from '../../../utils/types';
import type { InputLayoutProps } from '../input-layout/types';

// The second type parameter is the `multiple` flag (currently disabled).
export type SelectRootProps = Omit<
	_Select.Root.Props< string, false >,
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
	 * A function that gets called with the current value as an argument.
	 * Use this to customize the trigger content.
	 */
	children?: _Select.Value.Props[ 'children' ];
};

export type SelectPopupProps = ComponentProps< typeof _Select.Popup > & {
	/**
	 * The content to be rendered inside the popup.
	 */
	children?: React.ReactNode;
	/**
	 * A parent element to render the portal into.
	 */
	container?: _Select.Portal.Props[ 'container' ];
};

export type SelectItemProps = Omit<
	ComponentProps< typeof _Select.Item >,
	'value'
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
