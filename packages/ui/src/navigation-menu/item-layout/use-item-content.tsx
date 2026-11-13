import { Children, isValidElement } from '@wordpress/element';
import type { AriaAttributes, ReactNode } from 'react';
import { useItemContent as usePopupItemContent } from '../../utils/item-popup';
import { useKeyboardShortcutProps } from '../../utils/keyboard-shortcut';
import { ItemDescription } from './item-description';
import { ItemLabel } from './item-label';
import type { ItemLayoutProps } from './types';

type UseItemContentOptions = Pick<
	AriaAttributes,
	'aria-describedby' | 'aria-keyshortcuts' | 'aria-label' | 'aria-labelledby'
> & {
	shortcut?: ItemLayoutProps[ 'shortcut' ];
};

const ITEM_CONTENT_COMPONENTS = {
	Label: ItemLabel,
	Description: ItemDescription,
	validationMessage:
		'NavigationMenu: Use text or ItemLabel followed by ItemDescription components as link or trigger children.',
};

export function useItemContent(
	children: ReactNode,
	{
		shortcut,
		'aria-keyshortcuts': ariaKeyShortcuts,
		...ariaProps
	}: UseItemContentOptions
) {
	const hasStructuredContent = Children.toArray( children ).some(
		( child ) =>
			isValidElement( child ) &&
			( child.type === ItemLabel || child.type === ItemDescription )
	);
	const { contentChildren, itemAriaProps } = usePopupItemContent(
		hasStructuredContent ? children : <ItemLabel>{ children }</ItemLabel>,
		ITEM_CONTENT_COMPONENTS,
		ariaProps
	);
	const { descriptionId: shortcutDescriptionId, targetProps } =
		useKeyboardShortcutProps( {
			'aria-describedby': itemAriaProps[ 'aria-describedby' ],
			'aria-keyshortcuts': ariaKeyShortcuts,
			shortcut,
		} );

	return {
		contentChildren,
		itemAriaProps: { ...itemAriaProps, ...targetProps },
		shortcutDescriptionId,
	};
}
