import { Menu as BaseMenu } from '@base-ui/react/menu';
import type { ReactNode } from 'react';
import { forwardRef } from '@wordpress/element';
import { Icon, check, chevronRightSmall } from '@wordpress/icons';
import { Circle, SVG } from '@wordpress/primitives';
import clsx from 'clsx';
import { Text } from '../text';
import type * as Types from './types';
import styles from './styles.module.css';

function Root( props: Types.MenuRootProps ) {
	return <BaseMenu.Root { ...props } />;
}

const Trigger = forwardRef< HTMLButtonElement, Types.MenuTriggerProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.Trigger
			ref={ ref }
			className={ clsx( styles.trigger, className ) }
			{ ...props }
		/>
	)
);
Trigger.displayName = 'Menu.Trigger';

function Portal( props: Types.MenuPortalProps ) {
	return <BaseMenu.Portal { ...props } />;
}

const Positioner = forwardRef< HTMLDivElement, Types.MenuPositionerProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.Positioner
			ref={ ref }
			className={ clsx( styles.positioner, className ) }
			{ ...props }
		/>
	)
);
Positioner.displayName = 'Menu.Positioner';

const Popup = forwardRef< HTMLDivElement, Types.MenuPopupProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.Popup
			ref={ ref }
			className={ clsx( styles.popup, className ) }
			{ ...props }
		/>
	)
);
Popup.displayName = 'Menu.Popup';

const ItemLabel = forwardRef< HTMLSpanElement, Types.MenuItemLabelProps >(
	( { className, ...props }, ref ) => (
		<Text
			ref={ ref }
			variant="body-md"
			className={ clsx( styles.itemLabel, className ) }
			{ ...props }
		/>
	)
);
ItemLabel.displayName = 'Menu.ItemLabel';

const ItemHelpText = forwardRef< HTMLSpanElement, Types.MenuItemHelpTextProps >(
	( { className, ...props }, ref ) => (
		<Text
			ref={ ref }
			variant="body-sm"
			className={ clsx( styles.itemHelpText, className ) }
			{ ...props }
		/>
	)
);
ItemHelpText.displayName = 'Menu.ItemHelpText';

const CheckboxItemIndicator = forwardRef<
	HTMLSpanElement,
	Types.MenuCheckboxItemIndicatorProps
>( ( { className, ...props }, ref ) => (
	<BaseMenu.CheckboxItemIndicator
		ref={ ref }
		className={ clsx( styles.prefix, styles.indicatorPrefix, className ) }
		keepMounted
		{ ...props }
	>
		<Icon icon={ check } size={ 24 } />
	</BaseMenu.CheckboxItemIndicator>
) );
CheckboxItemIndicator.displayName = 'Menu.CheckboxItemIndicator';

const RadioItemIndicator = forwardRef<
	HTMLSpanElement,
	Types.MenuRadioItemIndicatorProps
>( ( { className, ...props }, ref ) => (
	<BaseMenu.RadioItemIndicator
		ref={ ref }
		className={ clsx( styles.prefix, styles.indicatorPrefix, className ) }
		keepMounted
		{ ...props }
	>
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<Circle cx={ 12 } cy={ 12 } r={ 3 } />
		</SVG>
	</BaseMenu.RadioItemIndicator>
) );
RadioItemIndicator.displayName = 'Menu.RadioItemIndicator';

const renderLabel = ( children: ReactNode ) => {
	if ( typeof children === 'string' || typeof children === 'number' ) {
		return <ItemLabel>{ children }</ItemLabel>;
	}

	return children;
};

const Item = forwardRef< HTMLDivElement, Types.MenuItemProps >(
	( { className, children, prefix, suffix, helpText, ...props }, ref ) => (
		<BaseMenu.Item
			ref={ ref }
			className={ clsx( styles.item, className ) }
			{ ...props }
		>
			<span className={ styles.prefix }>{ prefix }</span>
			<div className={ styles.content }>
				<div className={ styles.label }>
					{ renderLabel( children ) }
					{ helpText && <ItemHelpText>{ helpText }</ItemHelpText> }
				</div>
				{ suffix && (
					<span className={ styles.suffix }>{ suffix }</span>
				) }
			</div>
		</BaseMenu.Item>
	)
);
Item.displayName = 'Menu.Item';

const CheckboxItem = forwardRef< HTMLDivElement, Types.MenuCheckboxItemProps >(
	( { className, children, suffix, ...props }, ref ) => (
		<BaseMenu.CheckboxItem
			ref={ ref }
			className={ clsx( styles.item, className ) }
			{ ...props }
		>
			<CheckboxItemIndicator />
			<div className={ styles.content }>
				<div className={ styles.label }>
					{ renderLabel( children ) }
				</div>
				{ suffix && (
					<span className={ styles.suffix }>{ suffix }</span>
				) }
			</div>
		</BaseMenu.CheckboxItem>
	)
);
CheckboxItem.displayName = 'Menu.CheckboxItem';

const RadioItem = forwardRef< HTMLDivElement, Types.MenuRadioItemProps >(
	( { className, children, suffix, ...props }, ref ) => (
		<BaseMenu.RadioItem
			ref={ ref }
			className={ clsx( styles.item, className ) }
			{ ...props }
		>
			<RadioItemIndicator />
			<div className={ styles.content }>
				<div className={ styles.label }>
					{ renderLabel( children ) }
				</div>
				{ suffix && (
					<span className={ styles.suffix }>{ suffix }</span>
				) }
			</div>
		</BaseMenu.RadioItem>
	)
);
RadioItem.displayName = 'Menu.RadioItem';

const Separator = forwardRef< HTMLHRElement, Types.MenuSeparatorProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.Separator
			ref={ ref }
			className={ clsx( styles.separator, className ) }
			{ ...props }
		/>
	)
);
Separator.displayName = 'Menu.Separator';

const Group = forwardRef< HTMLDivElement, Types.MenuGroupProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.Group
			ref={ ref }
			className={ clsx( styles.group, className ) }
			{ ...props }
		/>
	)
);
Group.displayName = 'Menu.Group';

const RadioGroup = forwardRef< HTMLDivElement, Types.MenuRadioGroupProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.RadioGroup
			ref={ ref }
			className={ clsx( styles.group, className ) }
			{ ...props }
		/>
	)
);
RadioGroup.displayName = 'Menu.RadioGroup';

const SubmenuRoot = ( props: Types.MenuSubmenuRootProps ) => {
	return <BaseMenu.SubmenuRoot { ...props } />;
};
SubmenuRoot.displayName = 'Menu.SubmenuRoot';

const SubmenuTriggerItem = forwardRef<
	HTMLDivElement,
	Types.MenuSubmenuTriggerProps
>( ( { className, children, suffix, ...props }, ref ) => (
	<BaseMenu.SubmenuTrigger
		ref={ ref }
		className={ clsx( styles.item, className ) }
		{ ...props }
	>
		<div className={ styles.prefix } />
		<div className={ styles.content }>
			<div className={ styles.label }>{ renderLabel( children ) }</div>
			<span className={ styles.suffix }>
				{ suffix }
				<Icon
					icon={ chevronRightSmall }
					size={ 24 }
					className={ styles.submenuChevron }
				/>
			</span>
		</div>
	</BaseMenu.SubmenuTrigger>
) );
SubmenuTriggerItem.displayName = 'Menu.SubmenuTriggerItem';

const GroupLabel = forwardRef< HTMLDivElement, Types.MenuGroupLabelProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.GroupLabel
			ref={ ref }
			className={ clsx( styles.groupLabel, className ) }
			{ ...props }
		/>
	)
);
GroupLabel.displayName = 'Menu.GroupLabel';

export const Menu = {
	Root,
	Trigger,
	Portal,
	Positioner,
	Popup,
	Item,
	ItemLabel,
	ItemHelpText,
	CheckboxItem,
	CheckboxItemIndicator,
	RadioItem,
	RadioItemIndicator,
	Separator,
	Group,
	GroupLabel,
	RadioGroup,
	SubmenuRoot,
	SubmenuTriggerItem,
};
