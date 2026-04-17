import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { Menu as BaseMenu } from '@base-ui/react/menu';

export type MenuRootProps = ComponentPropsWithoutRef< typeof BaseMenu.Root >;
export type MenuTriggerProps = ComponentPropsWithoutRef<
	typeof BaseMenu.Trigger
>;
export type MenuPortalProps = ComponentPropsWithoutRef<
	typeof BaseMenu.Portal
>;
export type MenuPositionerProps = ComponentPropsWithoutRef<
	typeof BaseMenu.Positioner
>;
export type MenuPopupProps = ComponentPropsWithoutRef< typeof BaseMenu.Popup >;

// Extended to match Gutenberg's rich layout capabilities
export interface MenuItemProps
	extends Omit<
		ComponentPropsWithoutRef< typeof BaseMenu.Item >,
		'prefix' | 'suffix'
	> {
	prefix?: ReactNode;
	suffix?: ReactNode;
	helpText?: ReactNode;
}

export type MenuItemLabelProps = ComponentPropsWithoutRef< 'span' >;
export type MenuItemHelpTextProps = ComponentPropsWithoutRef< 'span' >;

export type MenuSeparatorProps = ComponentPropsWithoutRef<
	typeof BaseMenu.Separator
>;
export type MenuGroupProps = ComponentPropsWithoutRef< typeof BaseMenu.Group >;
export type MenuGroupLabelProps = ComponentPropsWithoutRef<
	typeof BaseMenu.GroupLabel
>;
export interface MenuCheckboxItemProps
	extends Omit<
		ComponentPropsWithoutRef< typeof BaseMenu.CheckboxItem >,
		'suffix'
	> {
	suffix?: ReactNode;
}
export type MenuCheckboxItemIndicatorProps = ComponentPropsWithoutRef<
	typeof BaseMenu.CheckboxItemIndicator
>;
export type MenuRadioGroupProps = ComponentPropsWithoutRef<
	typeof BaseMenu.RadioGroup
>;
export interface MenuRadioItemProps
	extends Omit<
		ComponentPropsWithoutRef< typeof BaseMenu.RadioItem >,
		'suffix'
	> {
	suffix?: ReactNode;
}
export type MenuRadioItemIndicatorProps = ComponentPropsWithoutRef<
	typeof BaseMenu.RadioItemIndicator
>;
export type MenuSubmenuRootProps = ComponentPropsWithoutRef<
	typeof BaseMenu.SubmenuRoot
>;
export interface MenuSubmenuTriggerProps
	extends Omit<
		ComponentPropsWithoutRef< typeof BaseMenu.SubmenuTrigger >,
		'suffix'
	> {
	suffix?: ReactNode;
}
