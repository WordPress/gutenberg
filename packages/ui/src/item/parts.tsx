import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef, useEffect } from '@wordpress/element';
import { arrowUpRight, chevronRight } from '@wordpress/icons';
import warning from '@wordpress/warning';
import { Icon } from '../icon';
import { Text } from '../text';
import styles from './style.module.css';
import { useRowContext } from './context';
import type {
	ActionsProps,
	ChevronProps,
	DescriptionProps,
	LabelProps,
	MediaProps,
	MetaProps,
} from './types';

/**
 * A leading icon, thumbnail or swatch. Hidden from assistive technology: a
 * row is named by its label, never by its picture.
 */
export const Media = forwardRef< HTMLSpanElement, MediaProps >(
	function ItemMedia( { render, ...props }, ref ) {
		return useRender( {
			defaultTagName: 'span',
			render,
			ref,
			props: mergeProps< 'span' >(
				{ 'aria-hidden': true, className: styles.media },
				props
			),
		} );
	}
);

/**
 * The name of the row. Required in `Item.LinkRow` and `Item.ButtonRow`,
 * where it is the accessible name of the link or button. It should match
 * the heading of the screen the row opens, or name the command it runs.
 */
export const Label = forwardRef< HTMLSpanElement, LabelProps >(
	function ItemLabel( { className, ...props }, ref ) {
		const context = useRowContext( 'Label' );

		useEffect( () => context?.register( 'label' ), [ context ] );

		return (
			<Text
				ref={ ref }
				variant="body-md"
				{ ...props }
				id={ context?.labelId }
				// The control of an activatable row takes its name from
				// this element. Without `aria-hidden`, a screen reader
				// would read the same text a second time after the control.
				aria-hidden={ context?.isActivatable || undefined }
				className={ clsx( styles.label, className ) }
			/>
		);
	}
);

/**
 * Supporting text. In `Item.LinkRow` and `Item.ButtonRow` it is also the
 * accessible description of the link or button.
 */
export const Description = forwardRef< HTMLSpanElement, DescriptionProps >(
	function ItemDescription( { className, ...props }, ref ) {
		const context = useRowContext( 'Description' );

		useEffect( () => context?.register( 'description' ), [ context ] );

		return (
			<Text
				ref={ ref }
				variant="body-sm"
				{ ...props }
				id={ context?.descriptionId }
				className={ clsx( styles.description, className ) }
			/>
		);
	}
);

/**
 * Trailing status or detail, such as a `Badge` or a current value. In
 * `Item.LinkRow` and `Item.ButtonRow` it is also part of the accessible
 * description of the link or button.
 *
 * Keep it static. Interactive elements belong in `Item.Actions`.
 */
export const Meta = forwardRef< HTMLSpanElement, MetaProps >( function ItemMeta(
	{ render, ...props },
	ref
) {
	const context = useRowContext( 'Meta' );

	useEffect( () => context?.register( 'meta' ), [ context ] );

	return useRender( {
		defaultTagName: 'span',
		render,
		ref,
		props: mergeProps< 'span' >( props, {
			id: context?.metaId,
			className: styles.meta,
		} ),
	} );
} );

/**
 * The glyph that says the row takes you somewhere. In an `Item.LinkRow`
 * that opens in a new tab, it shows the new-tab arrow in place of the
 * chevron. Hidden from assistive technology, and mirrored in right-to-left
 * languages.
 *
 * Do not use it in a row that has `Item.Actions`: next to a control, the
 * glyph reads as belonging to that control.
 */
export const Chevron = forwardRef< SVGSVGElement, ChevronProps >(
	function ItemChevron( { className, ...props }, ref ) {
		const context = useRowContext( 'Chevron' );

		useEffect( () => context?.register( 'chevron' ), [ context ] );

		useEffect( () => {
			if ( context?.hasActions ) {
				warning(
					'Item.Chevron: a row that holds controls should not also show a chevron. The glyph reads as belonging to the control beside it rather than to the row.'
				);
			}
		}, [ context?.hasActions ] );

		return (
			<Icon
				ref={ ref }
				icon={ context?.opensInNewTab ? arrowUpRight : chevronRight }
				aria-hidden="true"
				className={ clsx( styles.chevron, className ) }
				{ ...props }
			/>
		);
	}
);

/**
 * The controls of the row, each with its own activation target. They sit
 * above the link or button of an `Item.LinkRow` or `Item.ButtonRow`; they
 * are not inside it.
 *
 * The row does not add its label to the names of these controls. Give each
 * control a name that includes the row it acts on, such as "Reset
 * background color".
 */
export const Actions = forwardRef< HTMLSpanElement, ActionsProps >(
	function ItemActions( { render, ...props }, ref ) {
		const context = useRowContext( 'Actions' );

		useEffect( () => context?.register( 'actions' ), [ context ] );

		return useRender( {
			defaultTagName: 'span',
			render,
			ref,
			props: mergeProps< 'span' >( { className: styles.actions }, props ),
		} );
	}
);

Media.displayName = 'Item.Media';
Label.displayName = 'Item.Label';
Description.displayName = 'Item.Description';
Meta.displayName = 'Item.Meta';
Chevron.displayName = 'Item.Chevron';
Actions.displayName = 'Item.Actions';
