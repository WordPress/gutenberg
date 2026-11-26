import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef, useEffect } from '@wordpress/element';
import { arrowUpRight, chevronRight } from '@wordpress/icons';
import { Icon } from '../icon';
import { Text } from '../text';
import { enforceRenderProps } from '../utils/enforce-render-props';
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
 * The control of a link or button row references the label, the
 * description and the meta by their ids. A `render` element, or the element
 * a `render` function returns, would otherwise replace the id with its own
 * and break the reference. A static row references nothing, so it leaves
 * the id to the consumer.
 *
 * @param render The `render` prop of the part.
 * @param id     The id the row references, if it references one.
 */
function withId< TRender >( render: TRender, id: string | undefined ) {
	return id ? enforceRenderProps( render, { id } ) : render;
}

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
	function ItemLabel( { className, render, ...props }, ref ) {
		const context = useRowContext( 'Label' );
		const register = context?.register;
		const id = context?.isActivatable ? context.labelId : props.id;

		useEffect( () => register?.( 'label' ), [ register ] );

		return (
			<Text
				ref={ ref }
				variant="body-md"
				{ ...props }
				render={ withId( render, id ) }
				id={ id }
				// The control of an activatable row takes its name from
				// this element. Without `aria-hidden`, a screen reader
				// would read the same text a second time after the control.
				aria-hidden={
					context?.isActivatable ? true : props[ 'aria-hidden' ]
				}
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
	function ItemDescription( { className, render, ...props }, ref ) {
		const context = useRowContext( 'Description' );
		const register = context?.register;
		const id = context?.isActivatable ? context.descriptionId : props.id;

		useEffect( () => register?.( 'description' ), [ register ] );

		return (
			<Text
				ref={ ref }
				variant="body-sm"
				{ ...props }
				render={ withId( render, id ) }
				id={ id }
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
	const register = context?.register;
	const id = context?.isActivatable ? context.metaId : props.id;

	useEffect( () => register?.( 'meta' ), [ register ] );

	return useRender( {
		defaultTagName: 'span',
		render: withId( render, id ),
		ref,
		props: mergeProps< 'span' >( props, {
			id,
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
		const register = context?.register;

		useEffect( () => register?.( 'chevron' ), [ register ] );

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
		const register = context?.register;

		useEffect( () => register?.( 'actions' ), [ register ] );

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
