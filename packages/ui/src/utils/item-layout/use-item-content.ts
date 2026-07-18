import { Children, isValidElement, useEffect, useId } from '@wordpress/element';
import type { AriaAttributes, ReactNode } from 'react';
import { ItemDescription } from './item-description';
import { ItemLabel } from './item-label';
import type { ItemLayoutProps } from './types';

export type ItemAriaProps = Pick<
	AriaAttributes,
	'aria-describedby' | 'aria-keyshortcuts' | 'aria-label' | 'aria-labelledby'
>;

type UseItemContentOptions = ItemAriaProps & {
	labelledBy?: string;
	shortcut?: ItemLayoutProps[ 'shortcut' ];
};

export function getStructuredItemContent( children: ReactNode ) {
	const childArray = Children.toArray( children );
	const label = childArray.find(
		( child ) =>
			isValidElement< { id?: string } >( child ) &&
			child.type === ItemLabel
	);
	const description = childArray.find(
		( child ) =>
			isValidElement< { id?: string } >( child ) &&
			child.type === ItemDescription
	);

	return {
		descriptionId: isValidElement< { id?: string } >( description )
			? description.props.id
			: undefined,
		hasDescription: !! description,
		hasLabel: !! label,
		hasStructuredContent: childArray.some(
			( child ) =>
				isValidElement( child ) &&
				( child.type === ItemLabel || child.type === ItemDescription )
		),
		labelId: isValidElement< { id?: string } >( label )
			? label.props.id
			: undefined,
	};
}

export function useItemContent(
	children: ReactNode,
	{
		'aria-describedby': ariaDescribedBy,
		'aria-keyshortcuts': ariaKeyShortcuts,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		labelledBy: additionalLabelledBy,
		shortcut,
	}: UseItemContentOptions
) {
	const generatedLabelId = useId();
	const generatedDescriptionId = useId();
	const generatedShortcutDescriptionId = useId();
	const {
		descriptionId,
		hasDescription,
		hasLabel,
		hasStructuredContent,
		labelId,
	} = getStructuredItemContent( children );
	const resolvedLabelId =
		labelId ??
		( hasLabel || ! hasStructuredContent ? generatedLabelId : undefined );
	const resolvedDescriptionId = descriptionId ?? generatedDescriptionId;
	const shortcutDescriptionId = shortcut
		? generatedShortcutDescriptionId
		: undefined;

	useEffect( () => {
		if (
			process.env.NODE_ENV !== 'production' &&
			hasDescription &&
			! hasLabel &&
			! ariaLabel &&
			! ariaLabelledBy
		) {
			// The specification requires a non-fatal development warning here.
			// eslint-disable-next-line no-console
			console.warn(
				'ItemLayout: ItemDescription requires ItemLabel or an explicit accessible name.'
			);
		}
	}, [ ariaLabel, ariaLabelledBy, hasDescription, hasLabel ] );

	const describedBy = [
		ariaDescribedBy,
		hasDescription && resolvedDescriptionId,
		shortcutDescriptionId,
	]
		.filter( Boolean )
		.join( ' ' );
	/*
	 * `aria-labelledby` takes precedence over `aria-label` in the accessible
	 * name algorithm. Only provide our generated label relationship when the
	 * consumer has not supplied either explicit naming prop. Additional labels
	 * are only appended to that generated relationship, so explicit naming stays
	 * fully consumer-controlled.
	 */
	const labelledBy =
		ariaLabelledBy ??
		( ariaLabel
			? undefined
			: [ resolvedLabelId, additionalLabelledBy ]
					.filter( Boolean )
					.join( ' ' ) || undefined );

	return {
		contentContextValue: {
			descriptionId: resolvedDescriptionId,
			labelId: resolvedLabelId,
		},
		itemAriaProps: {
			'aria-describedby': describedBy || undefined,
			'aria-keyshortcuts': shortcut?.ariaKeyShortcut ?? ariaKeyShortcuts,
			'aria-label': ariaLabel,
			'aria-labelledby': labelledBy,
		},
		shortcutDescriptionId,
	};
}
