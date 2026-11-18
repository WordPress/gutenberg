import clsx from 'clsx';
import {
	Children,
	cloneElement,
	Fragment,
	forwardRef,
	isValidElement,
	useEffect,
} from '@wordpress/element';
import { chevronRight } from '@wordpress/icons';
import warning from '@wordpress/warning';
import type { ReactElement, ReactNode } from 'react';
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
	function ItemMedia( { className, children, ...props }, ref ) {
		return (
			<span
				ref={ ref }
				aria-hidden="true"
				className={ clsx( styles.media, className ) }
				{ ...props }
			>
				{ children }
			</span>
		);
	}
);

/**
 * The row's name. For `Item.Link` and `Item.Button` this alone is the
 * accessible name, so it should match the heading of the screen it opens or
 * name the command it runs.
 */
export const Label = forwardRef< HTMLSpanElement, LabelProps >(
	function ItemLabel( { className, children, ...props }, ref ) {
		const context = useRowContext( 'Label' );

		useEffect( () => context?.register( 'label' ), [ context ] );

		return (
			<Text
				ref={ ref }
				id={ context?.labelId }
				variant="body-md"
				className={ clsx( styles.label, className ) }
				{ ...props }
			>
				{ children }
			</Text>
		);
	}
);

/**
 * Supporting text, announced as a description rather than as part of the
 * row's name.
 */
export const Description = forwardRef< HTMLSpanElement, DescriptionProps >(
	function ItemDescription( { className, children, ...props }, ref ) {
		const context = useRowContext( 'Description' );

		useEffect( () => context?.register( 'description' ), [ context ] );

		return (
			<Text
				ref={ ref }
				id={ context?.descriptionId }
				variant="body-sm"
				className={ clsx( styles.description, className ) }
				{ ...props }
			>
				{ children }
			</Text>
		);
	}
);

/**
 * Trailing status or detail, such as a `Badge`. Announced as a description,
 * so it never becomes part of the row's name.
 */
export const Meta = forwardRef< HTMLSpanElement, MetaProps >( function ItemMeta(
	{ className, children, ...props },
	ref
) {
	const context = useRowContext( 'Meta' );

	useEffect( () => context?.register( 'meta' ), [ context ] );

	return (
		<span
			ref={ ref }
			id={ context?.metaId }
			className={ clsx( styles.meta, className ) }
			{ ...props }
		>
			{ children }
		</span>
	);
} );

/**
 * The glyph that says the row takes you somewhere. Hidden from assistive
 * technology, and mirrored in right-to-left.
 */
export const Chevron = forwardRef< SVGSVGElement, ChevronProps >(
	function ItemChevron( { className, ...props }, ref ) {
		const context = useRowContext( 'Chevron' );

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
				icon={ chevronRight }
				aria-hidden="true"
				className={ clsx( styles.chevron, className ) }
				{ ...props }
			/>
		);
	}
);

/**
 * Describes each control by the row it belongs to. A control keeps any
 * description of its own, and a fragment is looked through rather than
 * described, since a fragment carries nothing.
 */
function describe( children: ReactNode, ids: string ): ReactNode {
	return Children.map( children, ( child ) => {
		if ( ! isValidElement( child ) ) {
			return child;
		}

		if ( child.type === Fragment ) {
			const fragment = child as ReactElement< { children?: ReactNode } >;
			return describe( fragment.props.children, ids );
		}

		const element = child as ReactElement< {
			'aria-describedby'?: string;
		} >;
		const own = element.props[ 'aria-describedby' ];

		return cloneElement( element, {
			'aria-describedby': own ? `${ own } ${ ids }` : ids,
		} );
	} );
}

/**
 * Controls belonging to the row, each with its own activation target.
 *
 * Each is given the row's label and description as its `aria-describedby`,
 * so "Edit" is announced as "Edit, Soft shadow". A control that is a
 * function component which drops the prop keeps its own description
 * instead; pass `aria-describedby` yourself in that case.
 */
export const Actions = forwardRef< HTMLSpanElement, ActionsProps >(
	function ItemActions( { className, children, ...props }, ref ) {
		const context = useRowContext( 'Actions' );

		useEffect( () => context?.register( 'actions' ), [ context ] );

		const described = context?.actionDescribedBy
			? describe( children, context.actionDescribedBy )
			: children;

		return (
			<span
				ref={ ref }
				className={ clsx( styles.actions, className ) }
				{ ...props }
			>
				{ described }
			</span>
		);
	}
);

Media.displayName = 'Item.Media';
Label.displayName = 'Item.Label';
Description.displayName = 'Item.Description';
Meta.displayName = 'Item.Meta';
Chevron.displayName = 'Item.Chevron';
Actions.displayName = 'Item.Actions';
